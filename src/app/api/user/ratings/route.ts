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
    const { orderId, score, comment, menuItemId } = body;

    if (!orderId || !score || score < 1 || score > 5) {
      return NextResponse.json({ error: "Invalid rating details." }, { status: 400 });
    }

    // 1. Strict Constraint Validation (Ratings ONLY for COMPLETED orders!)
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.userId !== userId) {
      return NextResponse.json({ error: "You do not own this order." }, { status: 403 });
    }

    if (order.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "You can only submit reviews for Completed orders." },
        { status: 400 }
      );
    }

    // Check if user has already rated this item/order to prevent duplicates
    const existingRating = await prisma.rating.findFirst({
      where: {
        orderId,
        userId,
        menuItemId: menuItemId || null,
      },
    });

    if (existingRating) {
      return NextResponse.json(
        { error: "You have already submitted a rating for this order." },
        { status: 400 }
      );
    }

    // 2. Save Rating in DB
    const rating = await prisma.rating.create({
      data: {
        score: parseInt(score),
        comment: comment || "",
        orderId,
        userId,
        menuItemId: menuItemId || null,
        catererId: order.catererId, // Automatically link the caterer from the order!
      },
    });

    // 3. Auditing Logs (6 points) - RATING_SUBMITTED event
    await prisma.log.create({
      data: {
        action: "RATING_SUBMITTED",
        details: `User submitted score ${score} for Order ID: ${orderId} (Caterer: ${order.catererId})`,
        userId,
      },
    });

    return NextResponse.json({
      message: "Thank you! Your rating has been recorded.",
      rating,
    });
  } catch (error: any) {
    console.error("Save rating API error:", error);
    return NextResponse.json(
      { error: "Failed to record rating. Please retry." },
      { status: 500 }
    );
  }
}
