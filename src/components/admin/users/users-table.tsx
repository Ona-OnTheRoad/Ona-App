"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, RefreshCw, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NoHistoryIllustration } from "@/components/requests/no-history-illustration";
import { JobsPagination } from "@/components/admin/jobs/jobs-pagination";

export type UserItem = {
  id: string;
  role: "admin" | "motorist" | "repair_pro";
  full_name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  area: string | null;
  is_active: boolean;
  created_at: string;
  extra: string;
  statusText: string;
  isPending: boolean;
  hasMotoristProfile: boolean;
};

interface UsersTableProps {
  users: UserItem[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  roleFilter: string;
  onRoleFilterChange: (r: string) => void;
  onRefresh: () => void;
  onAssignRole: (id: string, role: string) => Promise<void>;
  onToggleActive: (id: string, currentActive: boolean) => Promise<void>;
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}

export function UsersTable({
  users,
  loading,
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  onRefresh,
  onAssignRole,
  onToggleActive,
  currentPage,
  totalPages,
  onPageChange,
}: UsersTableProps) {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpenDropdownId(null);
      }
    }
    if (openDropdownId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openDropdownId]);

  return (
    <div className="w-full bg-white dark:bg-[#0b0b0e] border border-gray-200 dark:border-[#27272a] rounded-2xl shadow-xs overflow-hidden min-h-[480px] flex flex-col">
      {/* Table Card Header Toolbar */}
      <div className="px-6 pt-5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white select-none">
          All users
        </h2>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Search Input */}
          <div className="relative flex items-center w-56 sm:w-64 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-[#18171c] border border-gray-200 dark:border-[#27272a] focus-within:border-ona-brand dark:focus-within:border-ona-brand transition-colors">
            <Search className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search name, email, phone"
              autoComplete="off"
              className="w-full bg-transparent border-0 p-0 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-0"
            />
          </div>

          {/* Role Filter Dropdown */}
          <select
            value={roleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value)}
            className="bg-gray-50 dark:bg-[#18171c] border border-gray-200 dark:border-[#27272a] rounded-xl px-3 py-1.5 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:border-ona-brand dark:focus:border-ona-brand cursor-pointer"
          >
            <option value="" className="dark:bg-[#18171c]">
              All roles
            </option>
            <option value="motorist" className="dark:bg-[#18171c]">
              Motorist
            </option>
            <option value="repair_pro" className="dark:bg-[#18171c]">
              Repair pro
            </option>
            <option value="admin" className="dark:bg-[#18171c]">
              Admin
            </option>
          </select>

          {/* Refresh Button */}
          <button
            type="button"
            disabled={loading}
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-ona-brand-btn hover:bg-ona-brand-press text-white text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Table / Empty State / Loading State */}
      {loading && users.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20 px-4 text-gray-400 dark:text-gray-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-ona-brand mb-3" />
          <span>Loading users…</span>
        </div>
      ) : users.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
          <NoHistoryIllustration className="w-52 h-40 max-w-full" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-4">
            No users found.
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs leading-relaxed">
            Try adjusting your search query or role filter.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto" ref={dropdownRef}>
          <table className="w-full text-left text-xs min-w-[850px] border-collapse">
            <thead className="bg-[#f3f4f6] dark:bg-[#18171c] border-y border-gray-200 dark:border-[#27272a]">
              <tr className="text-gray-900 dark:text-gray-200 text-xs font-semibold select-none">
                <th className="py-3 pl-6 pr-4 font-semibold w-[22%]">
                  Name/ Email
                </th>
                <th className="py-3 px-4 font-semibold w-[16%]">Contact</th>
                <th className="py-3 px-4 font-semibold w-[13%]">Status</th>
                <th className="py-3 px-4 font-semibold w-[15%]">Extra</th>
                <th className="py-3 px-4 font-semibold w-[11%]">Status</th>
                <th className="py-3 px-4 font-semibold w-[12%]">Assign Role</th>
                <th className="py-3 pl-4 pr-6 font-semibold w-[11%] text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#27272a] bg-white dark:bg-[#0b0b0e]">
              {users.map((u) => {
                const isMotorist = u.role === "motorist" || u.hasMotoristProfile;

                return (
                  <tr
                    key={u.id}
                    className="hover:bg-gray-50/70 dark:hover:bg-[#16151a] transition-colors"
                  >
                    {/* Name/Email */}
                    <td className="py-3.5 pl-6 pr-4">
                      <div className="font-semibold text-gray-900 dark:text-white text-xs">
                        {u.full_name || "Unnamed user"}
                      </div>
                      <div className="font-mono text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                        {u.email || "—"}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4 font-mono text-gray-700 dark:text-gray-300 text-xs">
                      {u.phone || "—"}
                    </td>

                    {/* Status (Role with Colored Dot) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-800 dark:text-gray-200">
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full shrink-0",
                            u.role === "motorist" && "bg-gray-700 dark:bg-gray-300",
                            u.role === "repair_pro" && "bg-emerald-500",
                            u.role === "admin" && "bg-[#ef4444]",
                          )}
                        />
                        <span className="capitalize">
                          {u.role === "motorist"
                            ? "Motorist"
                            : u.role === "repair_pro"
                            ? "Repair pro"
                            : "Admin"}
                        </span>
                      </span>
                    </td>

                    {/* Extra */}
                    <td className="py-3.5 px-4 text-gray-800 dark:text-gray-200 text-xs capitalize">
                      {u.extra}
                    </td>

                    {/* Status (Active / Pending / Inactive) */}
                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full capitalize border",
                          u.statusText === "Active" &&
                            "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
                          u.statusText === "Pending" &&
                            "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
                          u.statusText === "Inactive" &&
                            "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700",
                        )}
                      >
                        {u.statusText}
                      </span>
                    </td>

                    {/* Assign Role (Actions Dropdown) */}
                    <td className="py-3.5 px-4 relative">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenDropdownId((curr) =>
                            curr === u.id ? null : u.id,
                          )
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#18171c] text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#202026] transition-colors cursor-pointer select-none"
                      >
                        <span>Actions</span>
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      </button>

                      {openDropdownId === u.id && (
                        <div className="absolute left-4 top-11 z-30 w-44 rounded-xl bg-white dark:bg-[#18171c] border border-gray-200 dark:border-[#27272a] shadow-xl py-1 text-xs">
                          <button
                            type="button"
                            disabled={u.role === "motorist"}
                            onClick={() => {
                              setOpenDropdownId(null);
                              void onAssignRole(u.id, "motorist");
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-[#202026] text-gray-700 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Assign Motorist
                          </button>
                          <button
                            type="button"
                            disabled={u.role === "repair_pro"}
                            onClick={() => {
                              setOpenDropdownId(null);
                              void onAssignRole(u.id, "repair_pro");
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-[#202026] text-gray-700 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Assign Repair Pro
                          </button>
                          <button
                            type="button"
                            disabled={u.role === "admin"}
                            onClick={() => {
                              setOpenDropdownId(null);
                              void onAssignRole(u.id, "admin");
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-[#202026] text-gray-700 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Assign Admin
                          </button>
                          <div className="border-t border-gray-100 dark:border-[#27272a] my-1" />
                          <button
                            type="button"
                            onClick={() => {
                              setOpenDropdownId(null);
                              void onToggleActive(u.id, u.is_active);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-[#202026] text-gray-700 dark:text-gray-200"
                          >
                            {u.is_active ? "Deactivate User" : "Activate User"}
                          </button>
                        </div>
                      )}
                    </td>

                    {/* View User Link */}
                    <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                      {isMotorist ? (
                        <Link
                          href={`/admin/motorists/${u.id}`}
                          className="text-ona-brand hover:text-ona-brand-press font-medium text-xs transition-colors"
                        >
                          View user
                        </Link>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600 text-xs cursor-not-allowed select-none">
                          View user
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <JobsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}

