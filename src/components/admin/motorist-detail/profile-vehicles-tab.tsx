"use client";

import type { Detail, MotoristProfileRow } from "./types";

interface ProfileVehiclesTabProps {
  u?: Detail["user"];
  mot: MotoristProfileRow | null;
}

export function ProfileVehiclesTab({ u, mot }: ProfileVehiclesTabProps) {
  const vehicleName =
    [mot?.vehicle_make, mot?.vehicle_model, mot?.vehicle_year]
      .filter(Boolean)
      .join(" ") || "—";

  const mapPin =
    mot?.default_lat != null && mot?.default_lng != null
      ? `${mot.default_lat.toFixed(5)}, ${mot.default_lng.toFixed(5)}`
      : "—";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Left Column: Profile Card */}
      <div className="w-full bg-white dark:bg-[#0b0b0e] border border-gray-200 dark:border-[#27272a] rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-[#27272a]">
          <h3 className="text-base font-bold text-gray-900 dark:text-white select-none">
            Profile
          </h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-[#27272a]">
          <div className="px-6 py-4">
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
              EMAIL
            </span>
            <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mt-1 block">
              {u?.email || "—"}
            </span>
          </div>

          <div className="px-6 py-4">
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
              PHONE
            </span>
            <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mt-1 block">
              {u?.phone || "—"}
            </span>
          </div>

          <div className="px-6 py-4">
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
              LOCATION
            </span>
            <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mt-1 block">
              {[u?.area, u?.city].filter(Boolean).join(", ") ||
                mot?.address_text ||
                "—"}
            </span>
          </div>

          <div className="px-6 py-4">
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
              JOINED
            </span>
            <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mt-1 block">
              {u?.created_at
                ? new Date(u.created_at).toLocaleString()
                : "—"}
            </span>
          </div>

          <div className="px-6 py-4">
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
              USER ID
            </span>
            <span className="text-xs font-mono text-gray-600 dark:text-gray-400 mt-1 block select-all">
              {u?.id || "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Right Column: Vehicle & Identity Cards */}
      <div className="space-y-6">
        {/* Vehicle Card */}
        <div className="w-full bg-white dark:bg-[#0b0b0e] border border-gray-200 dark:border-[#27272a] rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-[#27272a]">
            <h3 className="text-base font-bold text-gray-900 dark:text-white select-none">
              Vehicle
            </h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-[#27272a]">
            <div className="px-6 py-4">
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                MAKE / MODEL / YEAR
              </span>
              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mt-1 block">
                {vehicleName}
              </span>
            </div>

            <div className="px-6 py-4">
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                PLATE
              </span>
              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mt-1 block">
                {mot?.plate_number || "—"}
              </span>
            </div>

            <div className="px-6 py-4">
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                MAP PIN
              </span>
              <span className="text-xs font-mono text-gray-600 dark:text-gray-400 mt-1 block">
                {mapPin}
              </span>
            </div>
          </div>
        </div>

        {/* Identity (NIN / BVN) Card */}
        <div className="w-full bg-white dark:bg-[#0b0b0e] border border-gray-200 dark:border-[#27272a] rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-[#27272a]">
            <h3 className="text-base font-bold text-gray-900 dark:text-white select-none">
              Identity (NIN / BVN)
            </h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-[#27272a]">
            <div className="px-6 py-4">
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                NIN
              </span>
              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mt-1 block">
                {mot?.nin_verified ? "Verified" : "Not verified"}
              </span>
            </div>

            <div className="px-6 py-4">
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                BVN
              </span>
              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mt-1 block">
                {mot?.bvn_verified ? "Verified" : "Not verified"}
              </span>
            </div>

            <div className="px-6 py-4">
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                VERIFIED AT
              </span>
              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mt-1 block">
                {mot?.identity_verified_at
                  ? new Date(mot.identity_verified_at).toLocaleString()
                  : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
