"use client";

import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { ArrowLeft, Clock, ShoppingBag, Phone, X, RefreshCw } from "lucide-react";
import ReusableTable from "@/components/ReusableTable";
import dynamicImport from "next/dynamic";

// Dynamically import LiveCall with SSR disabled to prevent PeerJS window ReferenceError!
const LiveCall = dynamicImport(() => import("@/components/LiveCall"), {
  ssr: false,
});

interface OrderRow {
  id: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  userEmail: string;
  itemsCount: number;
}

export default function OrdersClient({ orders }: { orders: OrderRow[] }) {
  const [activeCallOrder, setActiveCallOrder] = useState<OrderRow | null>(null);
  const [localOrders, setLocalOrders] = useState<OrderRow[]>(orders);
  const [updatingId, setUpdatingId] = useState("");

  // Handle status update dynamically on dashboard
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const response = await fetch(`/api/caterer/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status.");

      setLocalOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingId("");
    }
  };

  // Columns for Caterer Orders TanStack Table
  const columns: ColumnDef<OrderRow>[] = [
    {
      accessorKey: "id",
      header: "Order ID",
      cell: ({ row }) => <span className="font-mono text-[10px] text-textLight">{row.original.id.slice(0, 8)}</span>,
    },
    {
      accessorKey: "userEmail",
      header: "Customer",
      cell: ({ row }) => <span className="font-bold text-textDark">{row.original.userEmail}</span>,
    },
    {
      accessorKey: "createdAt",
      header: "Received At",
      cell: ({ row }) => (
        <span className="text-xs text-textLight">
          {new Date(row.original.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "totalPrice",
      header: "Earnings",
      cell: ({ row }) => (
        <span className="font-extrabold text-accent">${row.original.totalPrice.toFixed(2)}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <select
          value={row.original.status}
          disabled={updatingId === row.original.id}
          onChange={(e) => handleUpdateStatus(row.original.id, e.target.value)}
          className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold tracking-wide uppercase border focus:outline-none ${
            row.original.status === "COMPLETED"
              ? "bg-green-50 text-green-700 border-green-200"
              : row.original.status === "PREPARING"
              ? "bg-yellow-50 text-yellow-700 border-yellow-200"
              : row.original.status === "CANCELLED"
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-blue-50 text-blue-700 border-blue-200"
          }`}
        >
          {["PENDING", "PREPARING", "COMPLETED", "CANCELLED"].map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      ),
    },
    {
      id: "callAction",
      header: "Live Video Call",
      cell: ({ row }) => {
        if (row.original.status !== "CANCELLED") {
          return (
            <button
              onClick={() => setActiveCallOrder(row.original)}
              className="flex items-center gap-1.5 bg-secondary hover:bg-accent text-white font-extrabold text-[10px] px-3.5 py-2 rounded-full shadow-sm transition"
            >
              <Phone className="w-3.5 h-3.5" /> Call Customer
            </button>
          );
        }
        return <span className="text-xs text-textLight italic">Cancelled</span>;
      },
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 relative">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/caterer/dashboard" className="inline-flex items-center gap-2 text-secondary hover:text-accent font-bold">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1 bg-white border border-primary border-opacity-35 text-xs text-textLight font-semibold px-4 py-2 rounded-xl hover:bg-pink-50 hover:bg-opacity-20 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh List
          </button>
        </div>

        {/* Title Banner */}
        <div className="bg-white rounded-3xl p-6 border border-primary border-opacity-30 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 bg-pink-50 text-accent rounded-full flex items-center justify-center border border-pink-100 flex-shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-textDark">Pastry Orders Received</h1>
            <p className="text-xs text-textLight mt-0.5">
              Review order items, update completion status, or call your clients in real-time.
            </p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-3xl p-6 border border-primary border-opacity-30 shadow-xl">
          <ReusableTable
            data={localOrders}
            columns={columns}
            filterPlaceholder="Filter by customer email..."
            filterColumnId="userEmail"
          />
        </div>

      </div>

      {/* WEBRTC LIVE VIDEO CALL MODAL DRAWER */}
      {activeCallOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-65 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-primary border-opacity-30 shadow-2xl relative">
            <button
              onClick={() => setActiveCallOrder(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-background text-textLight hover:text-textDark transition"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-4">
              <span className="text-[10px] uppercase font-extrabold text-accent tracking-widest">
                Active Order P2P Connection
              </span>
              <h3 className="text-lg font-bold text-textDark mt-0.5">
                Calling Customer: {activeCallOrder.userEmail}
              </h3>
            </div>

            <LiveCall
              orderId={activeCallOrder.id}
              callerRole="CATERER"
              partnerName={activeCallOrder.userEmail.split("@")[0]}
            />
          </div>
        </div>
      )}

    </div>
  );
}
