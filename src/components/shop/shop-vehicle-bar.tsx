"use client";

/**
 * Compact vehicle chip bar for existing Shop shell (no redesign of shop chrome).
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Car, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { authFetch } from "@/lib/api-auth-headers";
import { isVehicleTrade } from "@/lib/shop/taxonomy";

export type ActiveVehicle = {
  id?: string;
  vehicleTypeSlug?: string;
  makeName: string;
  modelName: string;
  year: number | null;
  makeId?: string | null;
  modelId?: string | null;
};

const SESSION_KEY = "ona_shop_active_vehicle";

export function readSessionVehicle(): ActiveVehicle | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveVehicle;
  } catch {
    return null;
  }
}

export function writeSessionVehicle(v: ActiveVehicle | null) {
  if (typeof window === "undefined") return;
  if (!v) sessionStorage.removeItem(SESSION_KEY);
  else sessionStorage.setItem(SESSION_KEY, JSON.stringify(v));
}

export function ShopVehicleBar({
  tradeKey,
  onVehicle,
}: {
  tradeKey?: string;
  onVehicle?: (v: ActiveVehicle | null) => void;
}) {
  const { isAuthenticated } = useApp();
  const router = useRouter();
  const [active, setActive] = useState<ActiveVehicle | null>(null);
  const [loading, setLoading] = useState(true);

  const apply = useCallback(
    (v: ActiveVehicle | null) => {
      setActive(v);
      writeSessionVehicle(v);
      onVehicle?.(v);
    },
    [onVehicle],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const session = readSessionVehicle();
      if (session) {
        if (!cancelled) apply(session);
      }
      if (isAuthenticated) {
        try {
          const res = await authFetch("/api/shop/vehicles");
          const json = (await res.json()) as {
            ok?: boolean;
            data?: { active?: ActiveVehicle | null };
          };
          if (!cancelled && json.ok && json.data?.active) {
            const a = json.data.active;
            apply({
              id: a.id,
              vehicleTypeSlug: a.vehicleTypeSlug,
              makeName: a.makeName,
              modelName: a.modelName,
              year: a.year,
              makeId: a.makeId,
              modelId: a.modelId,
            });
          }
        } catch {
          /* keep session */
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, apply]);

  const label = active
    ? [active.year, active.makeName, active.modelName].filter(Boolean).join(" ")
    : "All";

  // Vehicle fitment belongs ONLY to vehicle-based trades (mechanic, body,
  // diagnostics, etc.). Non-vehicle trades (solar, plumber, carpenter,
  // generator, painter, fashion) never render the garage / ALL PARTS bar.
  if (tradeKey && !isVehicleTrade(tradeKey)) return null;

  return (
    <div className="flex items-center gap-2 rounded-ona-card border border-ona-border bg-ona-surface px-3 py-2.5">
      <Car aria-hidden className="h-4 w-4 shrink-0 text-ona-brand-ink" />
      {loading ? (
        <Loader2
          aria-label="Loading vehicle"
          className="h-4 w-4 animate-spin text-ona-muted"
        />
      ) : (
        <button
          type="button"
          onClick={() => router.push("/shop/vehicles")}
          className="flex min-w-0 flex-1 items-center gap-2 border-0 bg-transparent text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="line-clamp-1 block text-[13px] font-semibold text-ona-ink">
              {label === "All" ? "All cars" : label}
            </span>
            <span className="mt-0.5 block text-[10px] text-ona-muted">
              {active
                ? "Tap to change"
                : isAuthenticated
                  ? "Garage · pick make / model / year"
                  : "Sign in to save vehicles"}
            </span>
          </span>
          <ChevronDown
            aria-hidden
            className="h-4 w-4 shrink-0 text-ona-muted"
          />
        </button>
      )}
      {active ? (
        <>
          {tradeKey ? (
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/shop/c/${tradeKey}?allParts=1&makeName=${encodeURIComponent(active.makeName)}&modelName=${encodeURIComponent(active.modelName)}${active.year ? `&year=${active.year}` : ""}${active.makeId ? `&makeId=${active.makeId}` : ""}${active.modelId ? `&modelId=${active.modelId}` : ""}${active.vehicleTypeSlug ? `&vehicleType=${encodeURIComponent(active.vehicleTypeSlug)}` : ""}`,
                )
              }
              className="inline-flex shrink-0 items-center gap-0.5 rounded-full border-0 bg-ona-brand-btn px-2.5 py-1.5 text-[11px] font-semibold text-white"
            >
              ALL PARTS
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            title="Clear vehicle and browse all parts"
            onClick={() => apply(null)}
            className="shrink-0 rounded-md border-0 bg-transparent px-2 py-1.5 text-[11px] font-semibold text-ona-brand-ink"
          >
            All
          </button>
        </>
      ) : null}
    </div>
  );
}
