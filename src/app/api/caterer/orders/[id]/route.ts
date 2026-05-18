import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "pink-dessert-ceng382-super-secret-key-change-me"
);

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authToken = req.cookies.get("auth_token")?.value;
    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    let catererId = "";
    try {
      const { payload } = await jwtVerify(authToken, JWT_SECRET);
      catererId = payload.userId as string;
    } catch {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    const orderId = params.id;
    const body = await req.json();
    const { status } = body;

    if (!status || !["PENDING", "PREPARING", "COMPLETED", "CANCELLED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
    }

    // 1. Fetch Order and verify caterer owns it
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.catererId !== catererId) {
      return NextResponse.json({ error: "You do not own this order." }, { status: 403 });
    }

    // 2. Update status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    // 3. Log event (Auditing Logs System)
    await prisma.log.create({
      data: {
        action: "ORDER_STATUS_UPDATED",
        details: `Caterer updated Order ID: ${orderId} status to: ${status}`,
        userId: catererId,
      },
    });

    return NextResponse.json({
      message: "Order status updated successfully!",
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error("Caterer update order PATCH error:", error);
    return NextResponse.json({ error: "Failed to update order status." }, { status: 500 });
  }
}
