import { prisma } from "@/lib/prisma";
import { Users, Store, ShoppingBag, Activity, ShieldCheck, FileText } from "lucide-react";
import Link from "next/link";

// Server Component
export default async function AdminDashboard() {
  // Fetch real stats from database
  const totalUsers = await prisma.user.count({ where: { role: "USER" } });
  const totalCaterers = await prisma.user.count({ where: { role: "CATERER" } });
  const totalOrders = await prisma.order.count();
  const recentLogs = await prisma.log.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { user: true },
  });

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      {/* Header */}
      <div className="mb-10 animate-fade-in flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-textDark flex items-center gap-3">
            <ShieldCheck className="w-10 h-10 text-accent" />
            Admin Dashboard
          </h1>
          <p className="text-secondary mt-2 font-medium">
            System overview and platform management.
          </p>
        </div>
        <div>
          <Link href="/admin/logs" className="hidden md:flex items-center gap-2 bg-white border border-primary text-secondary px-6 py-2 rounded-full font-bold shadow-sm hover:bg-primary hover:text-white transition duration-300">
            <FileText className="w-5 h-5" /> View Full Logs
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-primary border-opacity-30 flex items-center gap-6 transform hover:-translate-y-2 transition duration-300">
          <div className="bg-blue-100 text-blue-500 p-4 rounded-full">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-textLight uppercase tracking-wider">Registered Users</p>
            <p className="text-3xl font-extrabold text-textDark">{totalUsers}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-primary border-opacity-30 flex items-center gap-6 transform hover:-translate-y-2 transition duration-300">
          <div className="bg-pink-100 text-accent p-4 rounded-full">
            <Store className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-textLight uppercase tracking-wider">Active Caterers</p>
            <p className="text-3xl font-extrabold text-textDark">{totalCaterers}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-primary border-opacity-30 flex items-center gap-6 transform hover:-translate-y-2 transition duration-300">
          <div className="bg-green-100 text-green-500 p-4 rounded-full">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-textLight uppercase tracking-wider">Total Orders</p>
            <p className="text-3xl font-extrabold text-textDark">{totalOrders}</p>
          </div>
        </div>
      </div>

      {/* Recent Activity Logs */}
      <div className="bg-white rounded-3xl shadow-lg border border-primary border-opacity-20 overflow-hidden">
        <div className="bg-primary bg-opacity-20 px-8 py-5 flex items-center justify-between border-b border-primary border-opacity-20">
          <h2 className="text-xl font-bold text-textDark flex items-center gap-2">
            <Activity className="w-6 h-6 text-accent" />
            Recent System Activity
          </h2>
          <Link href="/admin/logs" className="text-sm font-bold text-accent hover:underline md:hidden">
            View All
          </Link>
        </div>
        <div className="p-8">
          {recentLogs.length > 0 ? (
            <ul className="space-y-6">
              {recentLogs.map((log) => (
                <li key={log.id} className="flex items-start gap-4">
                  <div className="bg-secondary bg-opacity-10 text-secondary p-2 rounded-lg mt-1">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-textDark">{log.action}</p>
                    <p className="text-sm text-textLight">{log.details}</p>
                    <p className="text-xs text-textLight mt-1 italic">
                      {new Date(log.createdAt).toLocaleString()} 
                      {log.user ? ` • By: ${log.user.email}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-textLight italic text-center py-6">No recent logs found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
