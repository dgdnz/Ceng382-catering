"use client";

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { ArrowLeft, Activity } from "lucide-react";
import ReusableTable from "@/components/ReusableTable";

interface LogRow {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  userEmail: string;
}

export default function LogsClient({ logs }: { logs: LogRow[] }) {
  // Define columns for TanStack Table
  const columns: ColumnDef<LogRow>[] = [
    {
      accessorKey: "action",
      header: "Action / Event",
      cell: ({ row }) => (
        <span className="bg-primary bg-opacity-20 text-textDark px-3 py-1 rounded-full font-extrabold text-[10px] uppercase tracking-wider">
          {row.original.action}
        </span>
      ),
    },
    {
      accessorKey: "details",
      header: "Details",
      cell: ({ row }) => (
        <span className="text-xs text-textDark block max-w-md truncate font-semibold">
          {row.original.details || "-"}
        </span>
      ),
    },
    {
      accessorKey: "userEmail",
      header: "Triggered By",
      cell: ({ row }) => (
        <span className="text-xs text-secondary font-bold">
          {row.original.userEmail}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Timestamp",
      cell: ({ row }) => (
        <span className="text-xs text-textLight">
          {new Date(row.original.createdAt).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-secondary hover:text-accent font-bold">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="bg-white px-4 py-2 rounded-2xl border border-primary border-opacity-35 text-xs text-textLight font-semibold">
            Logged in as <span className="text-textDark font-bold">Admin</span>
          </div>
        </div>

        {/* Header Title */}
        <div className="bg-white rounded-3xl p-6 border border-primary border-opacity-30 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 bg-pink-50 text-accent rounded-full flex items-center justify-center border border-pink-100 flex-shrink-0">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-textDark">System Audit Logs</h1>
            <p className="text-xs text-textLight mt-0.5">
              Review real-time system events, actions, registrations, and transaction logs.
            </p>
          </div>
        </div>

        {/* TanStack Table Rendering */}
        <div className="bg-white rounded-3xl p-6 border border-primary border-opacity-30 shadow-xl">
          <ReusableTable
            data={logs}
            columns={columns}
            filterPlaceholder="Filter by Action (e.g. USER_LOGIN)..."
            filterColumnId="action"
          />
        </div>

      </div>
    </div>
  );
}
