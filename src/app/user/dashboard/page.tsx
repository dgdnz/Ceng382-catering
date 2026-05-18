import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "pink-dessert-ceng382-super-secret-key-change-me"
);

export const dynamic = "force-dynamic";

export default async function UserDashboard() {
  // 1. Identify logged-in User
  const cookieStore = cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) redirect("/login");

  let userId = "";
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    userId = payload.userId as string;
  } catch {
    redirect("/login");
  }

  // 2. Fetch User Data & Orders
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      caterer: true,
      orderItems: true,
    },
  });

  const totalPurchases = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + order.totalPrice, 0);

  const formattedOrders = orders.map((order) => ({
    id: order.id,
    totalPrice: order.totalPrice,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    catererName: order.caterer?.catererName || "Unknown Shop",
    itemsCount: order.orderItems.length,
    orderItems: order.orderItems.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      menuItemId: item.menuItemId,
    })),
  }));

  return (
    <DashboardClient
      orders={formattedOrders}
      userEmail={user?.email || "Customer"}
      totalPurchases={totalPurchases}
      totalSpent={totalSpent}
    />
  );
}
