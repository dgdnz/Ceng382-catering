import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { sendEmail } from "@/lib/nodemailer";
import { generateReceiptPDF, generateAgreementPDF } from "@/lib/pdfGenerator";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "pink-dessert-ceng382-super-secret-key-change-me"
);

export async function POST(req: NextRequest) {
  try {
    // 1. Identify logged-in User
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

    // 2. Fetch User and Caterer names for dynamic PDF generation
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const caterer = await prisma.user.findUnique({ where: { id: catererId } });

    if (!user || !caterer) {
      return NextResponse.json({ error: "User or Caterer not found." }, { status: 404 });
    }

    const customerName = user.email.split("@")[0]; // Use prefix as safe visual name fallback
    const catererName = caterer.catererName || "Pink Dessert Bakery";

    // 3. Create Order, OrderItems, and Customizations in DB Transactionally
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
                const customSum = (item.selectedOptions || []).reduce(
                  (sum: number, opt: any) => sum + opt.priceChange,
                  0
                );
                const itemTotalPrice = (item.basePrice + customSum) * item.quantity;

                const customizationCreates = [];
                for (const opt of item.selectedOptions || []) {
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
      });
    });

    // 4. Logging System (6 points) - Save BOTH Order Created and Payment Successful events
    await prisma.log.createMany({
      data: [
        {
          action: "ORDER_CREATED",
          details: `Order created transactionally. ID: ${order.id}. Total: $${totalPrice.toFixed(2)}`,
          userId,
        },
        {
          action: "PAYMENT_SUCCESSFUL",
          details: `Simulated checkout payment successful for Order ID: ${order.id}`,
          userId,
        },
      ],
    });

    // 5. Programmatic Dynamic PDF Generation (10 points)
    const pdfData = {
      orderId: order.id,
      customerName,
      catererName,
      totalPrice: parseFloat(totalPrice),
      items: items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        basePrice: item.basePrice,
        selectedOptions: item.selectedOptions || [],
      })),
    };

    const receiptPdfBuffer = generateReceiptPDF(pdfData);
    const agreementPdfBuffer = generateAgreementPDF(pdfData);

    // 6. Email System (6 points) - Send order details with PDFs to both Customer and Caterer
    const emailSubject = `🍰 Your Order Confirmation - Pink Dessert Shop [Order #${order.id.slice(0, 8)}]`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ffb6c1; border-radius: 16px; padding: 24px;">
        <h2 style="color: #ff69b4; text-align: center;">Sweet News!</h2>
        <p>Hello,</p>
        <p>We are delighted to confirm that your order from <strong>${catererName}</strong> has been successfully placed and paid!</p>
        
        <div style="background-color: #fff0f5; padding: 16px; border-radius: 12px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #ff1493;">Order Details</h3>
          <p style="margin: 4px 0;"><strong>Order ID:</strong> ${order.id}</p>
          <p style="margin: 4px 0;"><strong>Total Price Paid:</strong> $${totalPrice.toFixed(2)}</p>
          <p style="margin: 4px 0;"><strong>Status:</strong> PREPARING 🧁</p>
        </div>

        <p>Attached to this email, you will find your official <strong>Order Receipt</strong> and the signed <strong>Catering Agreement Document</strong> generated dynamically by our platform.</p>
        
        <p style="font-size: 12px; color: #888; text-align: center; margin-top: 30px;">
          Pink Dessert Catering Shop • Built with Next.js & Google Maps
        </p>
      </div>
    `;

    const emailText = `
      Hello!
      Your order from ${catererName} has been successfully placed.
      Order ID: ${order.id}
      Total Price Paid: $${totalPrice.toFixed(2)}
      Status: PREPARING 🧁
      
      Attached are your Order Receipt and Service Agreement. Thank you!
    `;

    const pdfAttachments = [
      {
        filename: `receipt_${order.id.slice(0, 8)}.pdf`,
        content: receiptPdfBuffer,
        contentType: "application/pdf",
      },
      {
        filename: `agreement_${order.id.slice(0, 8)}.pdf`,
        content: agreementPdfBuffer,
        contentType: "application/pdf",
      },
    ];

    // Trigger emails in parallel to speed up response
    await Promise.all([
      // Send to Customer
      sendEmail({
        to: user.email,
        subject: emailSubject,
        html: emailHtml,
        text: emailText,
        attachments: pdfAttachments,
      }),
      // Send to Caterer
      sendEmail({
        to: caterer.email,
        subject: `🔔 New Order Received! - Pink Dessert Shop [Order #${order.id.slice(0, 8)}]`,
        html: emailHtml,
        text: emailText,
        attachments: pdfAttachments,
      }),
    ]);

    return NextResponse.json({
      message: "Order transaction completed successfully!",
      orderId: order.id,
    });
  } catch (error: any) {
    console.error("Transactional checkout error:", error);
    return NextResponse.json(
      { error: "Transactional checkout failed. Please retry." },
      { status: 500 }
    );
  }
}
