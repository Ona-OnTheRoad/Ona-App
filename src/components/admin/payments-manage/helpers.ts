import type { Ops, Payment } from "./types";

export function naira(k: number) {
  return `₦${(k / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function effectiveOf(p: Payment): string {
  if (p.effective_status) return String(p.effective_status).toLowerCase();
  const esc = String(p.escrow_status || p.status || "").toLowerCase();
  if (esc === "released" || p.released_at) return "released";
  if (esc === "refunded") return "refunded";
  const paySt = String(p.payout_status || "").toLowerCase();
  if (paySt === "suspended_admin" || p.payout_suspended === true)
    return "suspended";
  if (esc === "failed" || paySt === "failed") return "failed";
  if (esc === "pending_settlement" || esc === "release_pending")
    return "pending_settlement";
  if (esc === "held" || esc === "pending_payment") return "held";
  if (String(p.status).toLowerCase() === "paid") return "held";
  return esc || "unknown";
}

/** What we owe the Repair Pro for one payment, in kobo (their net share when known). */
function owedKobo(p: Payment): number {
  const net = Number(p.pro_payout_kobo);
  if (Number.isFinite(net) && net > 0) return Math.round(net);
  const amount = Number(p.amount_kobo);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 0.875) : 0;
}

export type PayoutAttention = {
  /** Flutterwave Available is below what pending payouts need. */
  floatShort: null | {
    availableNgn: number;
    owedMinor: number;
    shortNgn: number;
    pendingCount: number;
  };
  /** Payouts that stopped retrying and wait for a manual release. */
  suspended: { count: number; owedMinor: number };
};

/** Pure: drives the "payouts need attention" banner on the Payments console. */
export function payoutAttention(
  ops: Ops | null,
  payments: Payment[],
): PayoutAttention {
  let pendingCount = 0;
  let pendingOwed = 0;
  let suspendedCount = 0;
  let suspendedOwed = 0;
  for (const p of payments) {
    const eff = effectiveOf(p);
    if (eff === "pending_settlement") {
      pendingCount += 1;
      pendingOwed += owedKobo(p);
    } else if (eff === "suspended") {
      suspendedCount += 1;
      suspendedOwed += owedKobo(p);
    }
  }
  const available = ops?.flw.available;
  const shortNgn =
    available != null && Number.isFinite(available)
      ? Math.round((pendingOwed / 100 - available) * 100) / 100
      : 0;
  return {
    floatShort:
      pendingCount > 0 && available != null && shortNgn > 0
        ? { availableNgn: available, owedMinor: pendingOwed, shortNgn, pendingCount }
        : null,
    suspended: { count: suspendedCount, owedMinor: suspendedOwed },
  };
}

export async function apiCall<T>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  try {
    const res = await fetch(path, {
      credentials: "include",
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
    const json = await res.json();
    if (!json.ok)
      return { ok: false, message: json.error?.message || "Request failed" };
    return { ok: true, data: json.data as T };
  } catch {
    return { ok: false, message: "Network error" };
  }
}
