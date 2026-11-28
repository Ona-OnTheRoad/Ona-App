"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { NoHistoryIllustration } from "@/components/requests/no-history-illustration";
import type { CatalogProduct } from "./catalog-types";

const AVAIL_STYLES: Record<string, string> = {
  available:
    "text-emerald-800 bg-emerald-100 dark:text-emerald-200 dark:bg-emerald-950/40",
  low_stock:
    "text-amber-800 bg-amber-100 dark:text-amber-200 dark:bg-amber-950/40",
  out_of_stock: "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-950/50",
  pre_order: "text-blue-800 bg-blue-100 dark:text-blue-200 dark:bg-blue-950/40",
  coming_soon:
    "text-violet-800 bg-violet-100 dark:text-violet-200 dark:bg-violet-950/40",
};

export function CatalogTable({
  products,
  loading,
  onRefresh,
  onEdit,
}: {
  products: CatalogProduct[];
  loading: boolean;
  onRefresh: () => void;
  onEdit: (id: string) => void;
}) {
  return (
    <div className="w-full bg-white dark:bg-[#0b0b0e] border border-gray-200 dark:border-[#27272a] rounded-2xl shadow-xs overflow-hidden min-h-[360px] flex flex-col">
      <div className="px-6 pt-5 pb-4 flex items-center justify-between gap-3">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white select-none">
          Products ({products.length})
        </h2>
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

      {loading && products.length === 0 ? (
        <div
          role="status"
          className="flex-1 flex flex-col items-center justify-center text-center py-20 px-4 text-gray-400 dark:text-gray-500 text-sm"
        >
          <Loader2 className="w-5 h-5 animate-spin text-ona-brand mb-3" />
          <span>Loading catalog…</span>
        </div>
      ) : products.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
          <NoHistoryIllustration className="w-52 h-40 max-w-full" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-4">
            No products yet.
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs leading-relaxed">
            Use + New product to add the first catalog item.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[720px] border-collapse">
            <thead className="bg-[#f3f4f6] dark:bg-[#18171c] border-y border-gray-200 dark:border-[#27272a]">
              <tr className="text-gray-900 dark:text-gray-200 text-xs font-semibold select-none">
                <th className="py-3 pl-6 pr-4 font-semibold">Product</th>
                <th className="py-3 px-4 font-semibold">Trade</th>
                <th className="py-3 px-4 font-semibold">Stock</th>
                <th className="py-3 px-4 font-semibold">Availability</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 pl-4 pr-6 font-semibold text-right"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#27272a] bg-white dark:bg-[#0b0b0e]">
              {products.map((p) => {
                const av = String(p.availability ?? "available");
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50/70 dark:hover:bg-[#16151a] transition-colors cursor-pointer"
                    onClick={() => onEdit(p.id)}
                  >
                    <td className="py-3.5 pl-6 pr-4">
                      <div className="flex items-center gap-3">
                        {p.primary_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            loading="lazy"
                            decoding="async"
                            src={p.primary_image_url}
                            alt=""
                            width={40}
                            height={40}
                            className="rounded-lg object-cover w-10 h-10 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-[#18171c] shrink-0" />
                        )}
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {p.name}
                          </div>
                          <div className="text-gray-400 dark:text-gray-500 text-[11px] mt-0.5">
                            {p.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-800 dark:text-gray-200">
                      {p.trade_key}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                      {Number(p.stock_qty ?? 0)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          "inline-flex text-[11px] font-bold rounded-full px-2.5 py-0.5 capitalize",
                          AVAIL_STYLES[av] || AVAIL_STYLES.available,
                        )}
                      >
                        {av.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 dark:text-gray-300">
                      {p.status}
                    </td>
                    <td className="py-3.5 pl-4 pr-6 text-right">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#27272a] text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#16151a] cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(p.id);
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
