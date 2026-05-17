import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { User as UserIcon, ShoppingBag, CreditCard, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "pink-dessert-ceng382-super-secret-key-change-me"
);

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

  // 2. Fetch User Data
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      caterer: true, // Fetch caterer details to show the shop name
      orderItems: true,
    },
  });

  const totalPurchases = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + order.totalPrice, 0);

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      {/* Header */}
      <div className="mb-10 animate-fade-in flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-textDark flex items-center gap-3">
            <UserIcon className="w-10 h-10 text-accent" />
            My Sweet Dashboard
          </h1>
          <p className="text-secondary mt-2 font-medium">
            Welcome back, {user?.email}! Ready for some delicious treats?
          </p>
        </div>
        <div>
          <Link href="/menus" className="bg-secondary text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-accent transition duration-300">
            Browse Pastries 🍩
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-primary border-opacity-30 flex items-center gap-6 transform hover:-translate-y-2 transition duration-300">
          <div className="bg-pink-100 text-accent p-5 rounded-full">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <div>
            <p className="text-sm font-bold text-textLight uppercase tracking-wider">Total Orders</p>
            <p className="text-4xl font-extrabold text-textDark">{totalPurchases}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-primary border-opacity-30 flex items-center gap-6 transform hover:-translate-y-2 transition duration-300">
          <div className="bg-green-100 text-green-500 p-5 rounded-full">
            <CreditCard className="w-10 h-10" />
          </div>
          <div>
            <p className="text-sm font-bold text-textLight uppercase tracking-wider">Total Amount Spent</p>
            <p className="text-4xl font-extrabold text-textDark">${totalSpent.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Order History */}
      <div className="bg-white rounded-3xl shadow-lg border border-primary border-opacity-20 overflow-hidden animate-fade-in">
        <div className="bg-primary bg-opacity-20 px-8 py-5 border-b border-primary border-opacity-20 flex items-center justify-between">
          <h2 className="text-xl font-bold text-textDark flex items-center gap-2">
            <Clock className="w-6 h-6 text-accent" />
            Recent Order History
          </h2>
        </div>
        
        <div className="p-2 sm:p-6">
          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 bg-background bg-opacity-30 rounded-2xl border border-primary border-opacity-30 hover:shadow-md transition duration-200">
                  <div className="mb-4 sm:mb-0">
                    <p className="font-bold text-textDark text-lg">
                      {order.caterer?.catererName || "Unknown Shop"}
                    </p>
                    <p className="text-sm text-textLight flex items-center gap-1 mt-1">
                      <Clock className="w-4 h-4" />
                      {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                    <div className="mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold bg-white border border-primary text-secondary">
                      {order.orderItems.length} items
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                    <p className="text-2xl font-extrabold text-textDark">
                      ${order.totalPrice.toFixed(2)}
                    </p>
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wide ${
                      order.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                      order.status === "PREPARING" ? "bg-yellow-100 text-yellow-700" :
                      order.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <span className="text-6xl mb-4 inline-block">🧁</span>
              <p className="text-textDark font-bold text-lg">No orders yet!</p>
              <p className="text-textLight mt-2">Your sweet journey begins with your first purchase.</p>
              <Link href="/menus" className="mt-6 inline-block bg-secondary text-white px-6 py-2 rounded-full font-bold shadow-sm hover:bg-accent transition duration-300">
                Start Exploring
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
