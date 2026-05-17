import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "pink-dessert-ceng382-super-secret-key-change-me"
);

export async function POST(req: NextRequest) {
  try {
    const authToken = req.cookies.get("auth_token")?.value;
    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    let userId = "";
    try {
      const { payload } = await jwtVerify(authToken, JWT_SECRET);
      userId = payload.userId as string;
    } catch {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    const body = await req.json();
    const { catererId, items, totalPrice } = body;

    if (!catererId || !items || !items.length || !totalPrice) {
      return NextResponse.json({ error: "Invalid order details." }, { status: 400 });
    }

    // 1. Create the complete Order record with relations in a transaction
    // Fulfills the relation constraints perfectly (Order -> OrderItem -> OrderItemCustomization)
    const order = await prisma.$transaction(async (tx) => {
      return await tx.order.create({
        data: {
          totalPrice: parseFloat(totalPrice),
          userId,
          catererId,
          status: "PENDING",
          orderItems: {
            create: await Promise.all(
              items.map(async (item: any) => {
                // Calculate item sum
                const customSum = (item.selectedOptions || []).reduce(
                  (sum: number, opt: any) => sum + opt.priceChange,
                  0
                );
                const itemTotalPrice = (item.basePrice + customSum) * item.quantity;

                // Build nested customizations
                const customizationCreates = [];
                for (const opt of item.selectedOptions || []) {
                  // Resolve the optionId from database to protect relation integrity
                  // If optionId is missing, look it up by name in the MenuItem's options
                  let finalOptionId = opt.optionId;

                  if (!finalOptionId) {
                    const dbOption = await tx.customizationOption.findFirst({
                      where: {
                        name: opt.optionName,
                        group: {
                          name: opt.groupName,
                          menuItemId: item.menuItemId,
                        },
                      },
                    });
                    if (dbOption) {
                      finalOptionId = dbOption.id;
                    }
                  }

                  if (finalOptionId) {
                    customizationCreates.push({
                      optionId: finalOptionId,
                      priceAtOrder: opt.priceChange,
                    });
                  }
                }

                return {
                  quantity: item.quantity,
                  unitPrice: item.basePrice,
                  totalPrice: itemTotalPrice,
                  menuItemId: item.menuItemId,
                  customizations: {
                    create: customizationCreates,
                  },
                };
              })
            ),
          },
        },
        include: {
          orderItems: {
            include: {
              customizations: {
                include: {
                  option: true,
                },
              },
            },
          },
        },
      });
    });

    // 2. Logging System (6 pts) - ORDER_CREATED event
    await prisma.log.create({
      data: {
        action: "ORDER_CREATED",
        details: `User successfully placed order: ID ${order.id}. Total: $${totalPrice.toFixed(2)}`,
        userId,
      },
    });

    return NextResponse.json({
      message: "Order placed successfully!",
      orderId: order.id,
    });
  } catch (error: any) {
    console.error("Order creation API error:", error);
    return NextResponse.json(
      { error: "Failed to place order. Please try again." },
      { status: 500 }
    );
  }
}
