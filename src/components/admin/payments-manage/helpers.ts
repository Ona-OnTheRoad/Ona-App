import type { Payment } from "./types";

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
