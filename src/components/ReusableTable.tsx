"use client";

import React, { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

interface ReusableTableProps<T extends object> {
  data: T[];
  columns: ColumnDef<T, any>[];
  filterPlaceholder?: string;
  filterColumnId?: string; // Column ID to apply the search filter on
}

export default function ReusableTable<T extends object>({
  data,
  columns,
  filterPlaceholder = "Search...",
  filterColumnId,
}: ReusableTableProps<T>) {
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  return (
    <div className="space-y-4">
      {/* 1. Global Filter Search Input */}
      {filterColumnId && (
        <div className="relative max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textLight">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-primary border-opacity-40 text-xs text-textDark bg-white focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition"
            placeholder={filterPlaceholder}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>
      )}

      {/* 2. Responsive Table Container */}
      <div className="overflow-x-auto rounded-2xl border border-primary border-opacity-35 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-primary divide-opacity-20 text-left text-xs">
          <thead className="bg-background bg-opacity-40 text-textDark uppercase font-extrabold tracking-wider">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-6 py-4 font-extrabold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-primary divide-opacity-10 bg-white text-textDark font-medium">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-pink-50 hover:bg-opacity-20 transition">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-textLight italic">
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 3. TanStack Table Pagination Controls */}
      <div className="flex items-center justify-between px-2 text-xs font-bold text-textLight">
        <div className="flex items-center gap-2">
          <span>Show</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="px-2 py-1.5 rounded-lg border border-primary border-opacity-30 text-textDark bg-white focus:outline-none"
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size} records
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4">
          <span>
            Page <span className="text-textDark">{table.getState().pagination.pageIndex + 1}</span> of{" "}
            <span className="text-textDark">{table.getPageCount()}</span>
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-lg border border-primary border-opacity-30 text-secondary hover:bg-primary hover:text-white disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-lg border border-primary border-opacity-30 text-secondary hover:bg-primary hover:text-white disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
