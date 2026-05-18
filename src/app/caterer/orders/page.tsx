import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import OrdersClient from "./OrdersClient";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "pink-dessert-ceng382-super-secret-key-change-me"
);

export const dynamic = "force-dynamic";

export default async function CatererOrdersPage() {
  // 1. Identify logged-in Caterer
  const cookieStore = cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) redirect("/login");

  let catererId = "";
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    catererId = payload.userId as string;
  } catch {
    redirect("/login");
  }

  // 2. Fetch all orders for this caterer
  const orders = await prisma.order.findMany({
    where: { catererId },
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      orderItems: true,
    },
  });

  const formattedOrders = orders.map((order) => ({
    id: order.id,
    totalPrice: order.totalPrice,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    userEmail: order.user?.email || "Unknown Customer",
    itemsCount: order.orderItems.length,
  }));

  return <OrdersClient orders={formattedOrders} />;
}
