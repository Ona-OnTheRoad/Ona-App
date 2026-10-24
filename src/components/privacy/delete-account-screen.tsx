"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ShieldAlert,
  Trash2,
  Wallet,
} from "lucide-react";
import { PrivacyScreenHeader } from "@/components/privacy/privacy-screen-header";
import { navigateBack } from "@/lib/navigation";
import { useApp } from "@/lib/store";
import { getAppSupabase } from "@/lib/supabase/app-client";
import { toastError, toastSuccess } from "@/lib/toast";

export function DeleteAccountScreen() {
  const router = useRouter();
  const { logout, accountType, hasMotoristAccount, hasProAccount } = useApp();

  const hasBoth = hasMotoristAccount && hasProAccount;
  const [deleteTarget, setDeleteTarget] = useState<
    "motorist" | "professional" | "both"
  >(hasBoth ? "both" : hasProAccount ? "professional" : "motorist");

  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const confirmWord = "DELETE";
  const isConfirmed = typed.trim().toUpperCase() === confirmWord;

  const handleBack = () => {
    navigateBack(router, "/settings/privacy", accountType);
  };

  const handleDelete = async () => {
    setErr(null);
    if (!isConfirmed) {
      setErr(`Please type ${confirmWord} exactly to confirm.`);
      return;
    }

    setBusy(true);
    try {
      const sb = getAppSupabase();
      const { data: sessionData } = await sb!.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: token,
          targetRole: deleteTarget,
        }),
      });

      const json = await res.json().catch(() => ({ ok: true }));
      if (json && !json.ok) {
        toastError(json.error?.message || "Deletion failed. Please try again.");
        setBusy(false);
        return;
      }

      toastSuccess(
        deleteTarget === "both"
          ? "Account scheduled for deletion."
          : "Role profile scheduled for deletion.",
      );

      if (deleteTarget === "both") {
        await logout();
        router.replace("/login");
      } else {
        router.replace("/");
      }
    } catch {
      toastError("Could not complete deletion. Please contact support.");
      setBusy(false);
    }
  };

  const consequences = [
    {
      icon: Calendar,
      title: "Appointments & bookings",
      detail: "Any upcoming or active bookings will be automatically canceled.",
    },
    {
      icon: Wallet,
      title: "Wallet balance & transactions",
      detail: "Ensure all pending balances or payouts are settled before proceeding.",
    },
    {
      icon: ShieldAlert,
      title: "Profile & saved vehicles",
      detail: "Saved vehicles, addresses, payment cards, and chat history will be erased.",
    },
  ];

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto min-h-full px-4 pb-8 flex flex-col justify-between">
        <div className="space-y-4">
          <PrivacyScreenHeader
            title="Delete account"
            description="Permanently delete your Ona account or remove an active role."
            onBack={handleBack}
          />

          {/* 30-Day Grace Period Callout Card */}
          <div className="rounded-ona-card border border-red-200 dark:border-red-900/40 bg-[#FEF0F2] dark:bg-red-950/20 p-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 text-[#C70036] mt-0.5">
                <AlertTriangle className="h-4.5 w-4.5" strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-[#C70036] dark:text-red-400">
                  30-day grace period
                </p>
                <p className="text-[12px] font-normal text-red-700/90 dark:text-red-300/90 mt-1 leading-relaxed">
                  Your account will be deactivated immediately and scheduled for
                  permanent deletion. If you change your mind, you can recover
                  it within 30 days by logging back in.
                </p>
              </div>
            </div>
          </div>

          {/* Multi-role Selector if applicable */}
          {hasBoth && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ona-muted px-1">
                SELECT WHAT TO DELETE
              </p>

              <div className="rounded-ona-card border border-ona-border bg-ona-surface shadow-xs divide-y divide-ona-border overflow-hidden">
                <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-ona-field/50 transition-colors">
                  <div className="min-w-0 pr-3">
                    <p className="text-[14px] font-bold text-ona-ink">
                      Customer account only
                    </p>
                    <p className="text-[12px] font-normal text-ona-muted mt-0.5">
                      Keep your Repair Pro account active
                    </p>
                  </div>
                  <input
                    type="radio"
                    name="deleteTarget"
                    value="motorist"
                    checked={deleteTarget === "motorist"}
                    onChange={() => setDeleteTarget("motorist")}
                    className="h-4.5 w-4.5 accent-brand cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-ona-field/50 transition-colors">
                  <div className="min-w-0 pr-3">
                    <p className="text-[14px] font-bold text-ona-ink">
                      Repair Pro account only
                    </p>
                    <p className="text-[12px] font-normal text-ona-muted mt-0.5">
                      Keep your Customer account active
                    </p>
                  </div>
                  <input
                    type="radio"
                    name="deleteTarget"
                    value="professional"
                    checked={deleteTarget === "professional"}
                    onChange={() => setDeleteTarget("professional")}
                    className="h-4.5 w-4.5 accent-brand cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-ona-field/50 transition-colors">
                  <div className="min-w-0 pr-3">
                    <p className="text-[14px] font-bold text-ona-ink">
                      Both accounts (Complete deletion)
                    </p>
                    <p className="text-[12px] font-normal text-ona-muted mt-0.5">
                      Permanently remove all profiles and data
                    </p>
                  </div>
                  <input
                    type="radio"
                    name="deleteTarget"
                    value="both"
                    checked={deleteTarget === "both"}
                    onChange={() => setDeleteTarget("both")}
                    className="h-4.5 w-4.5 accent-brand cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Consequences Card */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ona-muted px-1">
              BEFORE YOU GO
            </p>

            <div className="rounded-ona-card border border-ona-border bg-ona-surface p-4 shadow-xs divide-y divide-ona-border">
              {consequences.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ona-field text-ona-muted mt-0.5">
                      <Icon className="h-4 w-4" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-ona-ink">
                        {item.title}
                      </p>
                      <p className="text-[12px] font-normal text-ona-muted mt-0.5 leading-snug">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Confirmation Input Card */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ona-muted px-1">
              CONFIRMATION
            </p>

            <div className="rounded-ona-card border border-ona-border bg-ona-surface p-4 shadow-xs space-y-3">
              <label
                htmlFor="confirm-delete-input"
                className="block text-[13px] font-semibold text-ona-ink"
              >
                To confirm deletion, please type{" "}
                <span className="font-bold text-[#C70036]">{confirmWord}</span>{" "}
                below:
              </label>

              <div className="relative">
                <input
                  id="confirm-delete-input"
                  type="text"
                  value={typed}
                  onChange={(e) => {
                    setTyped(e.target.value);
                    if (err) setErr(null);
                  }}
                  placeholder={confirmWord}
                  autoComplete="off"
                  className="h-12 w-full rounded-ona-ctl border border-ona-border bg-ona-field px-4 text-[14px] font-bold tracking-wider text-ona-ink placeholder:text-ona-muted/40 placeholder:font-normal outline-none focus:outline-none transition-all"
                />
                {isConfirmed && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                )}
              </div>

              {err ? (
                <p className="text-[12px] font-medium text-red-600 dark:text-red-400">
                  {err}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Action Buttons at Bottom */}
        <div className="pt-8 pb-4 space-y-3">
          <button
            type="button"
            disabled={!isConfirmed || busy}
            onClick={() => void handleDelete()}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-full bg-[#C70036] hover:bg-red-700 active:scale-[0.99] text-white font-bold text-[14px] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
          >
            <Trash2 className="h-4 w-4" strokeWidth={2.2} />
            <span>{busy ? "Scheduling deletion..." : "Delete my account"}</span>
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={handleBack}
            className="w-full h-12 flex items-center justify-center rounded-full border border-ona-border bg-ona-surface hover:bg-ona-field text-ona-ink font-semibold text-[14px] transition-all cursor-pointer"
          >
            Keep my account
          </button>
        </div>
      </div>
    </div>
  );
}
