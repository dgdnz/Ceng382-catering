import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { Store, CheckCircle, Star, DollarSign, PackageOpen } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "pink-dessert-ceng382-super-secret-key-change-me"
);

export default async function CatererDashboard() {
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

  // 2. Fetch Caterer Data
  const caterer = await prisma.user.findUnique({
    where: { id: catererId },
  });

  const totalOrders = await prisma.order.count({ where: { catererId } });
  const completedOrders = await prisma.order.count({
    where: { catererId, status: "COMPLETED" },
  });

  // Calculate earnings (Mock/simulated based on completed orders)
  const orders = await prisma.order.findMany({
    where: { catererId, status: "COMPLETED" },
    select: { totalPrice: true },
  });
  const totalEarnings = orders.reduce((sum, order) => sum + order.totalPrice, 0);

  // Average Rating
  const ratings = await prisma.rating.findMany({
    where: { catererId },
    select: { score: true },
  });
  const avgRating = ratings.length > 0 
    ? (ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length).toFixed(1)
    : "No Ratings";

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      {/* Header */}
      <div className="mb-10 animate-fade-in flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-textDark flex items-center gap-3">
            <Store className="w-10 h-10 text-accent" />
            {caterer?.catererName || "My Catering Shop"}
          </h1>
          <p className="text-secondary mt-2 font-medium">
            Manage your pastry business and track your sweet success!
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/caterer/menu" className="bg-white border border-primary text-secondary px-6 py-2 rounded-full font-bold shadow-sm hover:bg-primary hover:text-white transition duration-300">
            Manage Menu
          </Link>
          <Link href="/caterer/orders" className="bg-secondary text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-accent transition duration-300">
            View Orders
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-primary border-opacity-30 flex flex-col justify-center items-center text-center transform hover:-translate-y-2 transition duration-300">
          <div className="bg-blue-100 text-blue-500 p-4 rounded-full mb-4">
            <PackageOpen className="w-8 h-8" />
          </div>
          <p className="text-sm font-bold text-textLight uppercase tracking-wider">Total Orders</p>
          <p className="text-3xl font-extrabold text-textDark mt-1">{totalOrders}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-primary border-opacity-30 flex flex-col justify-center items-center text-center transform hover:-translate-y-2 transition duration-300">
          <div className="bg-green-100 text-green-500 p-4 rounded-full mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <p className="text-sm font-bold text-textLight uppercase tracking-wider">Completed</p>
          <p className="text-3xl font-extrabold text-textDark mt-1">{completedOrders}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-primary border-opacity-30 flex flex-col justify-center items-center text-center transform hover:-translate-y-2 transition duration-300">
          <div className="bg-yellow-100 text-yellow-500 p-4 rounded-full mb-4">
            <Star className="w-8 h-8" />
          </div>
          <p className="text-sm font-bold text-textLight uppercase tracking-wider">Avg Rating</p>
          <p className="text-3xl font-extrabold text-textDark mt-1">
            {avgRating} {ratings.length > 0 && <span className="text-lg text-yellow-500">★</span>}
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-primary border-opacity-30 flex flex-col justify-center items-center text-center transform hover:-translate-y-2 transition duration-300">
          <div className="bg-pink-100 text-accent p-4 rounded-full mb-4">
            <DollarSign className="w-8 h-8" />
          </div>
          <p className="text-sm font-bold text-textLight uppercase tracking-wider">Total Earnings</p>
          <p className="text-3xl font-extrabold text-accent mt-1">${totalEarnings.toFixed(2)}</p>
        </div>
      </div>

      {/* Quick Action / Notice Area */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-extrabold mb-2">Ready for more orders?</h2>
          <p className="max-w-xl font-medium opacity-90 mb-6">
            Make sure your menu is up to date and your customizations are set. Our customers love dynamic options like "Extra Strawberry Syrup" or "Gluten-Free Base"!
          </p>
          <Link href="/caterer/menu/new" className="inline-block bg-white text-secondary font-bold px-8 py-3 rounded-full hover:bg-gray-50 transition duration-300 shadow-md">
            + Add New Menu Item
          </Link>
        </div>
        <div className="absolute -bottom-10 -right-10 text-9xl opacity-20 transform -rotate-12">
          🧁
        </div>
      </div>
    </div>
  );
}
