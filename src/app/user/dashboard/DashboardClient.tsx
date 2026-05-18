"use client";

import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { User as UserIcon, ShoppingBag, CreditCard, Clock, Star, MessageSquare, X, Phone } from "lucide-react";
import ReusableTable from "@/components/ReusableTable";
import dynamicImport from "next/dynamic";

// Dynamically import LiveCall with SSR disabled to prevent PeerJS window ReferenceError!
const LiveCall = dynamicImport(() => import("@/components/LiveCall"), {
  ssr: false,
});

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  menuItemId: string;
}

interface OrderRow {
  id: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  catererName: string;
  itemsCount: number;
  orderItems: OrderItem[];
}

export default function DashboardClient({
  orders,
  userEmail,
  totalPurchases,
  totalSpent,
}: {
  orders: OrderRow[];
  userEmail: string;
  totalPurchases: number;
  totalSpent: number;
}) {
  // Modal states
  const [ratingOrder, setRatingOrder] = useState<OrderRow | null>(null);
  const [activeCallOrder, setActiveCallOrder] = useState<OrderRow | null>(null);

  // Rating values
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");
  const [ratingError, setRatingError] = useState("");
  const [ratingSuccess, setRatingSuccess] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  const handleOpenRating = (order: OrderRow) => {
    setRatingOrder(order);
    setScore(5);
    setComment("");
    setRatingError("");
    setRatingSuccess("");
  };

  const handleSubmittingRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingOrder) return;

    setSubmittingRating(true);
    setRatingError("");
    setRatingSuccess("");

    try {
      const response = await fetch("/api/user/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: ratingOrder.id,
          score,
          comment,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit rating.");

      setRatingSuccess(data.message);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setRatingError(err.message);
    } finally {
      setSubmittingRating(false);
    }
  };

  // Define Columns for TanStack Orders Table
  const columns: ColumnDef<OrderRow>[] = [
    {
      accessorKey: "catererName",
      header: "Pastry Shop",
      cell: ({ row }) => (
        <span className="font-extrabold text-textDark text-sm">
          {row.original.catererName}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Order Date",
      cell: ({ row }) => (
        <span className="text-xs text-textLight">
          {new Date(row.original.createdAt).toLocaleDateString()} at{" "}
          {new Date(row.original.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      accessorKey: "itemsCount",
      header: "Treats Qty",
      cell: ({ row }) => (
        <span className="bg-primary bg-opacity-20 text-secondary px-2.5 py-0.5 rounded-full text-[10px] font-bold">
          {row.original.itemsCount} Items
        </span>
      ),
    },
    {
      accessorKey: "totalPrice",
      header: "Total Price",
      cell: ({ row }) => (
        <span className="font-extrabold text-textDark">${row.original.totalPrice.toFixed(2)}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
            row.original.status === "COMPLETED"
              ? "bg-green-100 text-green-700"
              : row.original.status === "PREPARING"
              ? "bg-yellow-100 text-yellow-700"
              : row.original.status === "CANCELLED"
              ? "bg-red-100 text-red-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {row.original.status}
        </span>
      ),
    },
    {
      id: "liveCallAction",
      header: "Support Line",
      cell: ({ row }) => {
        if (row.original.status !== "CANCELLED") {
          return (
            <button
              onClick={() => setActiveCallOrder(row.original)}
              className="flex items-center gap-1 bg-secondary hover:bg-accent text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-full shadow-sm transition"
            >
              <Phone className="w-3.5 h-3.5" /> Call Baker
            </button>
          );
        }
        return <span className="text-[10px] text-textLight italic">Cancelled</span>;
      },
    },
    {
      id: "ratingAction",
      header: "Feedback",
      cell: ({ row }) => {
        if (row.original.status === "COMPLETED") {
          return (
            <button
              onClick={() => handleOpenRating(row.original)}
              className="flex items-center gap-1 bg-yellow-50 hover:bg-yellow-400 hover:text-white text-yellow-600 font-extrabold text-[10px] px-3 py-1.5 rounded-full border border-yellow-200 transition"
            >
              <Star className="w-3.5 h-3.5 fill-current" /> Rate Order
            </button>
          );
        }
        return <span className="text-[10px] text-textLight italic font-semibold">Preparing...</span>;
      },
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-textDark flex items-center gap-3">
              <UserIcon className="w-10 h-10 text-accent" />
              My Sweet Dashboard
            </h1>
            <p className="text-secondary mt-2 font-medium">
              Welcome back, {userEmail}! Ready for some delicious treats?
            </p>
          </div>
          <div>
            <Link
              href="/menus"
              className="bg-secondary text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-accent transition duration-300"
            >
              Browse Pastries 🍩
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {/* TanStack Table for Order History */}
        <div className="bg-white rounded-3xl shadow-lg border border-primary border-opacity-20 overflow-hidden">
          <div className="bg-primary bg-opacity-20 px-8 py-5 border-b border-primary border-opacity-20">
            <h2 className="text-xl font-bold text-textDark flex items-center gap-2">
              <Clock className="w-6 h-6 text-accent" />
              Recent Order History
            </h2>
          </div>
          
          <div className="p-6">
            <ReusableTable
              data={orders}
              columns={columns}
              filterPlaceholder="Search by bakery name..."
              filterColumnId="catererName"
            />
          </div>
        </div>

      </div>

      {/* RATING SUBMISSION POPUP MODAL */}
      {ratingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-primary border-opacity-30 shadow-2xl space-y-6 animate-zoom-in">
            
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-extrabold text-accent tracking-wider">
                  Review Bakery Experience
                </span>
                <h3 className="text-xl font-extrabold text-textDark mt-1">
                  Rate "{ratingOrder.catererName}"
                </h3>
              </div>
              <button
                onClick={() => setRatingOrder(null)}
                className="p-1.5 rounded-full hover:bg-background text-textLight hover:text-textDark transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {ratingError && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-xl">
                <p className="text-xs text-red-700 font-bold">{ratingError}</p>
              </div>
            )}

            {ratingSuccess && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-xl">
                <p className="text-xs text-green-700 font-bold">{ratingSuccess}</p>
              </div>
            )}

            <form onSubmit={handleSubmittingRating} className="space-y-4">
              
              {/* Star Selector */}
              <div>
                <label className="block text-xs font-bold text-textDark mb-2">
                  How many stars would you give?
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setScore(star)}
                      className="p-1 transition duration-150 transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= score ? "text-yellow-400 fill-current" : "text-gray-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment Input */}
              <div>
                <label className="block text-xs font-bold text-textDark mb-1">
                  Leave a Comment / Review
                </label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-primary border-opacity-60 text-textDark bg-background bg-opacity-15 focus:outline-none focus:ring-secondary focus:border-secondary text-sm font-semibold"
                  placeholder="Share details of your tasty experience..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={submittingRating}
                className="w-full bg-secondary hover:bg-accent text-white font-extrabold py-3.5 rounded-full transition shadow-md flex justify-center items-center gap-2 text-sm disabled:opacity-50"
              >
                <MessageSquare className="w-4 h-4" />
                {submittingRating ? "Submitting Review..." : "Submit Review"}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* WEBRTC LIVE VIDEO CALL MODAL DRAWER FOR USER */}
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
                Calling Baker: {activeCallOrder.catererName}
              </h3>
            </div>

            <LiveCall
              orderId={activeCallOrder.id}
              callerRole="USER"
              partnerName={activeCallOrder.catererName}
            />
          </div>
        </div>
      )}

    </div>
  );
}
