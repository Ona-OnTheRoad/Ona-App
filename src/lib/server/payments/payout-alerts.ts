import "server-only";
import { PAYOUT_ON_HOLD_ESCROW } from "@/lib/jobs/constants";
import { insertNotification } from "@/lib/server/notifications";
import {
  listEscrowsByStatuses,
  type EscrowStatus,
} from "@/lib/server/payments/escrow-store";
import { getFlutterwaveNgnBalances } from "@/lib/server/payments/providers";
import { isResendConfigured, sendResendEmail } from "@/lib/server/resend";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { createServiceSupabase } from "@/lib/supabase/server";

/** Job escrow states in which a payout is still being worked on automatically. */
const PENDING_JOB_ESCROW: EscrowStatus[] = [
  "pending_settlement",
  "release_pending",
];

/** Staff who can act on payouts (profiles.role values that exist for staff). */
const FINANCE_ROLES = ["admin", "super_admin", "manager", "operations"];

/**
 * A payout stopped retrying (24h window over, or a hard transfer failure) and
 * now needs an admin. Moves the JOB out of `pending_settlement` so the Repair
 * Pro's screen and dashboard stop spinning, and tells them what is happening.
 *
 * Only flips a job that is still pending: a released, refunded or cancelled job
 * is never touched. Idempotent, and it also heals jobs that were suspended
 * before this state existed (the next attempt reaches here).
 */
export async function markJobPayoutOnHold(jobId: string): Promise<boolean> {
  if (!jobId || !isSupabaseAdminConfigured()) return false;
  try {
    const sb = createServiceSupabase();
    const { data, error } = await sb
      .from("service_requests")
      .update({
        escrow_status: PAYOUT_ON_HOLD_ESCROW,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .in("escrow_status", PENDING_JOB_ESCROW)
      .select("id, repair_pro_id")
      .maybeSingle();
    if (error || !data) return false;

    const proId = String((data as { repair_pro_id?: string | null }).repair_pro_id || "");
    if (proId) {
      // Deduped per job by group_key, so retries never notify twice.
      await insertNotification({
        userId: proId,
        category: "payments",
        priority: "high",
        title: "Payout on hold",
        body: "We couldn't complete your payout automatically. Our team has been told and will release it manually. If your bank details changed, update them in Settings → Payments.",
        href: `/jobs/${jobId}`,
        actionType: "open_job",
        actionPayload: { jobId },
        jobId,
        jobStatus: "satisfied",
        groupKey: `payout-on-hold-pro-${jobId}`,
      });
    }
    return true;
  } catch {
    return false;
  }
}

/** What we owe a Service Pro for one escrow row, in kobo. */
export function owedPayoutMinor(e: {
  proPayoutMinor?: number | null;
  amountMinor?: number | null;
  meta?: Record<string, unknown> | null;
}): number {
  const fromRow = Number(e.proPayoutMinor);
  if (Number.isFinite(fromRow) && fromRow > 0) return Math.round(fromRow);
  const fromMeta = Number(e.meta?.proPayoutMinor);
  if (Number.isFinite(fromMeta) && fromMeta > 0) return Math.round(fromMeta);
  // Not computed yet: the Pro's net share is 87.5% of what was charged.
  const amount = Number(e.amountMinor);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 0.875) : 0;
}

/** Can Flutterwave's Available balance cover what is owed? Pure, for tests. */
export function payoutFloatStatus(input: {
  availableNgn: number;
  owedMinor: number;
}): { short: boolean; owedNgn: number; shortfallNgn: number } {
  const owedNgn = Math.round(input.owedMinor) / 100;
  const shortfallNgn = Math.max(0, Math.round((owedNgn - input.availableNgn) * 100) / 100);
  return { short: shortfallNgn > 0, owedNgn, shortfallNgn };
}

const money = (n: number) =>
  `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Compares Flutterwave Available with what pending payouts need. When it falls
 * short, emails finance staff, at most once per staff member per day. Called from
 * the payout retry run; never throws.
 */
export async function checkPayoutFloatAndAlert(): Promise<{
  checked: boolean;
  short?: boolean;
  emailed?: number;
}> {
  try {
    if (!isSupabaseAdminConfigured()) return { checked: false };
    const pending = await listEscrowsByStatuses(PENDING_JOB_ESCROW, 100);
    if (!pending.length) return { checked: true, short: false };

    const balances = await getFlutterwaveNgnBalances();
    if (!balances) return { checked: false };

    const owedMinor = pending.reduce((sum, e) => sum + owedPayoutMinor(e), 0);
    const status = payoutFloatStatus({ availableNgn: balances.available, owedMinor });
    if (!status.short) return { checked: true, short: false };
    if (!isResendConfigured()) return { checked: true, short: true, emailed: 0 };

    const sb = createServiceSupabase();
    let staff = await sb
      .from("profiles")
      .select("id, email, full_name")
      .in("role", FINANCE_ROLES)
      .eq("is_active", true)
      .not("email", "is", null);
    if (staff.error) {
      // An unknown role value in the list fails the whole query: fall back to admins.
      staff = await sb
        .from("profiles")
        .select("id, email, full_name")
        .eq("role", "admin")
        .eq("is_active", true)
        .not("email", "is", null);
    }
    const day = new Date().toISOString().slice(0, 10);
    const subject = "Payouts are waiting on Flutterwave balance";
    const text = `Flutterwave Available is ${money(balances.available)} (Ledger ${money(balances.ledger)}), but ${pending.length} Service Pro payout${pending.length === 1 ? "" : "s"} totalling ${money(status.owedNgn)} ${pending.length === 1 ? "is" : "are"} waiting. Short by ${money(status.shortfallNgn)}.\n\nTop up the Available balance, or wait for collected funds to settle. Payouts retry every 10 minutes and are suspended for manual release after 24 hours. Open Admin > Payments to see them.`;
    let emailed = 0;
    for (const row of (staff.data || []) as Array<{ id: string; email: string | null }>) {
      if (!row.email) continue;
      // The notification row is only a once-a-day marker: insertNotification
      // dedupes on (user, group_key), so a repeat returns `skipped`.
      const marker = await insertNotification({
        userId: row.id,
        category: "payments",
        priority: "normal",
        title: subject,
        body: text.split("\n")[0],
        groupKey: `payout-float-low-${day}`,
        push: false,
      });
      if ("error" in marker || ("skipped" in marker && marker.skipped)) continue;
      const sent = await sendResendEmail({
        to: row.email,
        subject,
        text,
        html: `<p>${text.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>`,
      });
      if (sent.ok) emailed++;
    }
    return { checked: true, short: true, emailed };
  } catch (e) {
    console.error("checkPayoutFloatAndAlert", e instanceof Error ? e.message : e);
    return { checked: false };
  }
}
