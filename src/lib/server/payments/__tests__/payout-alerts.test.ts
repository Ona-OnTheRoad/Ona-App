import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeSupabase, type Row } from "@/test-utils/fake-supabase";

const mocks = vi.hoisted(() => ({
  sb: null as unknown,
  insertNotification: vi.fn(),
  listEscrows: vi.fn(),
  balances: vi.fn(),
  resendConfigured: vi.fn(() => true),
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/supabase/env", () => ({ isSupabaseAdminConfigured: () => true }));
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabase: () => mocks.sb }));
vi.mock("@/lib/server/notifications", () => ({ insertNotification: mocks.insertNotification }));
vi.mock("@/lib/server/payments/escrow-store", () => ({ listEscrowsByStatuses: mocks.listEscrows }));
vi.mock("@/lib/server/payments/providers", () => ({ getFlutterwaveNgnBalances: mocks.balances }));
vi.mock("@/lib/server/resend", () => ({
  isResendConfigured: mocks.resendConfigured,
  sendResendEmail: mocks.sendEmail,
}));

import {
  checkPayoutFloatAndAlert,
  markJobPayoutOnHold,
  owedPayoutMinor,
  payoutFloatStatus,
} from "../payout-alerts";

const db = (tables: Record<string, Row[]>) => {
  mocks.sb = new FakeSupabase(tables);
  return mocks.sb as FakeSupabase;
};
const job = (over: Row = {}): Row => ({ id: "j1", repair_pro_id: "pro-1", escrow_status: "pending_settlement", status: "satisfied", ...over });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.insertNotification.mockResolvedValue({ id: "n1" });
  mocks.resendConfigured.mockReturnValue(true);
  mocks.sendEmail.mockResolvedValue({ ok: true });
});

describe("owedPayoutMinor", () => {
  it("prefers the stored net payout, then meta, then 87.5% of the charge", () => {
    expect(owedPayoutMinor({ proPayoutMinor: 1877000, amountMinor: 2127000 })).toBe(1877000);
    expect(owedPayoutMinor({ proPayoutMinor: 0, meta: { proPayoutMinor: 500 }, amountMinor: 9999 })).toBe(500);
    expect(owedPayoutMinor({ amountMinor: 2000000 })).toBe(1750000);
    expect(owedPayoutMinor({})).toBe(0);
  });
});

describe("payoutFloatStatus", () => {
  it("reports the shortfall when Available cannot cover what is owed", () => {
    // The real case: Available ₦0 against a ₦18,770 payout.
    expect(payoutFloatStatus({ availableNgn: 0, owedMinor: 1877000 })).toEqual({ short: true, owedNgn: 18770, shortfallNgn: 18770 });
    expect(payoutFloatStatus({ availableNgn: 10000, owedMinor: 1877000 })).toMatchObject({ short: true, shortfallNgn: 8770 });
  });
  it("is fine when Available covers it exactly or more", () => {
    expect(payoutFloatStatus({ availableNgn: 18770, owedMinor: 1877000 }).short).toBe(false);
    expect(payoutFloatStatus({ availableNgn: 99999, owedMinor: 1877000 }).short).toBe(false);
  });
});

describe("markJobPayoutOnHold", () => {
  it.each(["pending_settlement", "release_pending"])("moves a %s job to on-hold and tells the Pro once", async (state) => {
    const sb = db({ service_requests: [job({ escrow_status: state })] });
    expect(await markJobPayoutOnHold("j1")).toBe(true);
    expect(sb.rows.service_requests[0].escrow_status).toBe("payout_on_hold");
    expect(mocks.insertNotification).toHaveBeenCalledTimes(1);
    expect(mocks.insertNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "pro-1", title: "Payout on hold", groupKey: "payout-on-hold-pro-j1", jobId: "j1" }),
    );
  });

  it("is idempotent: a job already on hold is left alone and nobody is notified again", async () => {
    db({ service_requests: [job({ escrow_status: "payout_on_hold" })] });
    expect(await markJobPayoutOnHold("j1")).toBe(false);
    expect(mocks.insertNotification).not.toHaveBeenCalled();
  });

  it.each(["released", "refunded", "held", "pending_payment", null])(
    "never touches a job whose escrow is %s",
    async (state) => {
      const sb = db({ service_requests: [job({ escrow_status: state })] });
      expect(await markJobPayoutOnHold("j1")).toBe(false);
      expect(sb.rows.service_requests[0].escrow_status).toBe(state);
      expect(mocks.insertNotification).not.toHaveBeenCalled();
    },
  );

  it("does not affect other jobs, and survives an unknown job id", async () => {
    const sb = db({ service_requests: [job(), job({ id: "j2", escrow_status: "pending_settlement" })] });
    await markJobPayoutOnHold("j1");
    expect(sb.rows.service_requests[1].escrow_status).toBe("pending_settlement");
    expect(await markJobPayoutOnHold("nope")).toBe(false);
    expect(await markJobPayoutOnHold("")).toBe(false);
  });

  it("still succeeds when the notification cannot be written", async () => {
    db({ service_requests: [job()] });
    mocks.insertNotification.mockRejectedValue(new Error("db down"));
    // The state change is what matters; a failed notice must not undo or throw.
    await expect(markJobPayoutOnHold("j1")).resolves.toBe(false);
  });
});

describe("checkPayoutFloatAndAlert", () => {
  const pending = (n: number, payoutMinor = 1877000) =>
    Array.from({ length: n }, (_, i) => ({ requestId: `j${i}`, proPayoutMinor: payoutMinor, amountMinor: payoutMinor, meta: {} }));
  const staff = (rows: Row[] = [{ id: "a1", email: "ops@ona.test", is_active: true, role: "admin" }]) => db({ profiles: rows });

  it("does nothing, and never calls Flutterwave, when no payout is pending", async () => {
    staff();
    mocks.listEscrows.mockResolvedValue([]);
    expect(await checkPayoutFloatAndAlert()).toEqual({ checked: true, short: false });
    expect(mocks.balances).not.toHaveBeenCalled();
  });

  it("skips quietly when the balance cannot be read", async () => {
    staff();
    mocks.listEscrows.mockResolvedValue(pending(1));
    mocks.balances.mockResolvedValue(null);
    expect(await checkPayoutFloatAndAlert()).toEqual({ checked: false });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("does not email when Available covers everything owed", async () => {
    staff();
    mocks.listEscrows.mockResolvedValue(pending(2));
    mocks.balances.mockResolvedValue({ available: 50000, ledger: 1267936.84 });
    expect(await checkPayoutFloatAndAlert()).toEqual({ checked: true, short: false });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("emails staff with the real numbers when Available (₦0) cannot cover the payout", async () => {
    staff();
    mocks.listEscrows.mockResolvedValue(pending(1));
    mocks.balances.mockResolvedValue({ available: 0, ledger: 1267936.84 });
    const res = await checkPayoutFloatAndAlert();
    expect(res).toEqual({ checked: true, short: true, emailed: 1 });
    const mail = mocks.sendEmail.mock.calls[0][0] as { to: string; subject: string; text: string };
    expect(mail.to).toBe("ops@ona.test");
    expect(mail.text).toContain("₦0.00");
    expect(mail.text).toContain("₦18,770.00");
    expect(mail.text).toContain("₦1,267,936.84");
  });

  it("emails each staff member at most once a day (the marker is deduped)", async () => {
    staff([
      { id: "a1", email: "a@ona.test", is_active: true, role: "admin" },
      { id: "a2", email: "b@ona.test", is_active: true, role: "admin" },
    ]);
    mocks.listEscrows.mockResolvedValue(pending(1));
    mocks.balances.mockResolvedValue({ available: 0, ledger: 0 });
    // a1 already alerted today (skipped marker), a2 is new.
    mocks.insertNotification.mockResolvedValueOnce({ id: "x", skipped: true }).mockResolvedValueOnce({ id: "y" });
    const res = await checkPayoutFloatAndAlert();
    expect(res).toMatchObject({ short: true, emailed: 1 });
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1);
    expect((mocks.sendEmail.mock.calls[0][0] as { to: string }).to).toBe("b@ona.test");
    // The marker never pushes to a phone and is keyed per day.
    expect(mocks.insertNotification).toHaveBeenCalledWith(
      expect.objectContaining({ push: false, groupKey: expect.stringMatching(/^payout-float-low-\d{4}-\d{2}-\d{2}$/) }),
    );
  });

  it("does not email when the marker cannot be written (avoids a mail every 10 minutes)", async () => {
    staff();
    mocks.listEscrows.mockResolvedValue(pending(1));
    mocks.balances.mockResolvedValue({ available: 0, ledger: 0 });
    mocks.insertNotification.mockResolvedValue({ error: "db" });
    expect(await checkPayoutFloatAndAlert()).toMatchObject({ short: true, emailed: 0 });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("only reports the shortfall when email is not configured", async () => {
    staff();
    mocks.resendConfigured.mockReturnValue(false);
    mocks.listEscrows.mockResolvedValue(pending(1));
    mocks.balances.mockResolvedValue({ available: 0, ledger: 0 });
    expect(await checkPayoutFloatAndAlert()).toEqual({ checked: true, short: true, emailed: 0 });
  });

  it("never throws, even if a dependency blows up", async () => {
    mocks.listEscrows.mockRejectedValue(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(checkPayoutFloatAndAlert()).resolves.toEqual({ checked: false });
  });
});
