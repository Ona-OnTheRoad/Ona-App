"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Info } from "lucide-react";
import { useFeedbackToast } from "@/lib/use-feedback-toast";
import { PRO_SERVICE_LABELS, isProService } from "@/lib/pro-service-id";
import { MIN_OFFER_AMOUNT_MAJOR } from "@/lib/jobs/constants";
import { formatMoney } from "@/lib/pricing";
import { navigateBack } from "@/lib/navigation";
import type { ProService } from "@/lib/types";
import { useApp } from "@/lib/store";

export default function SettingsPricingPage() {
  const router = useRouter();
  const { accountType, userProfile, updateUserProfile } = useApp();
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useFeedbackToast(msg ?? "", err ?? "");

  const skills = (userProfile?.services || []).filter(isProService);

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const s of skills) {
      const v = userProfile?.servicePrices?.[s];
      next[s] = v != null && v !== "" ? String(v) : "";
    }
    setPrices(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.services, userProfile?.servicePrices]);

  const save = () => {
    setErr(null);
    setMsg(null);
    const servicePrices: Partial<Record<ProService, number>> = {
      ...(userProfile?.servicePrices as Partial<Record<ProService, number>>),
    };
    for (const s of skills) {
      const raw = (prices[s] || "").trim();
      if (!raw) {
        delete servicePrices[s];
        continue;
      }
      const n = Number(raw);
      if (!Number.isFinite(n) || n < MIN_OFFER_AMOUNT_MAJOR) {
        setErr(
          `${PRO_SERVICE_LABELS[s]}: minimum labour price is ${formatMoney(MIN_OFFER_AMOUNT_MAJOR)} so payouts can complete.`,
        );
        return;
      }
      servicePrices[s] = n;
    }
    const e = updateUserProfile({ servicePrices });
    if (e) setErr(e);
    else setMsg("Labour prices saved. Parts are never included.");
  };

  const currency = userProfile?.pricingCurrency || "NGN";

  if (accountType !== "professional") {
    return (
      <div className="ona2 flex h-full flex-col bg-ona-bg text-ona-ink">
        <header className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => navigateBack(router, "/settings/sections/pricing", accountType)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ona-ink"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-[20px] font-semibold tracking-tight">Pricing & services</h1>
        </header>
        <p className="px-4 text-[13px] text-ona-muted">Repair Pros only.</p>
      </div>
    );
  }

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto flex min-h-full flex-col justify-between px-4 pb-8 pt-3">
        <div>
          {/* Back button */}
          <div className="flex items-center mb-3">
            <button
              type="button"
              onClick={() => navigateBack(router, "/settings/sections/pricing", "professional")}
              className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-ona-ink hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Back to Pricing & Services"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2.4} />
            </button>
          </div>

          {/* Heading */}
          <h1 className="text-[20px] font-semibold tracking-tight text-ona-ink">
            Pricing & services
          </h1>

          {/* Info Card */}
          <div className="mt-4 rounded-ona-card border border-ona-border bg-ona-field p-3.5 flex items-start gap-2.5 text-ona-muted">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-ona-muted" />
            <p className="text-[11px] leading-relaxed">
              No assumed defaults. Leave blank if you quote on request. Skill list
              comes from your registration (edit via verification / profile flow).
            </p>
          </div>

          {/* Skill List Inputs */}
          <div className="mt-6 space-y-5">
            {skills.length === 0 ? (
              <div>
                <label className="block text-[13px] font-semibold text-ona-ink mb-1.5">
                  Mechanic labour ({currency})
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Leave empty for quote on request"
                  className="w-full rounded-ona-ctl border border-ona-border bg-ona-field px-3.5 py-3 text-[13px] text-ona-ink outline-none transition-colors focus:border-brand placeholder:text-ona-muted"
                />
              </div>
            ) : (
              skills.map((s) => (
                <div key={s}>
                  <label className="block text-[13px] font-semibold text-ona-ink mb-1.5">
                    {PRO_SERVICE_LABELS[s]} labour ({currency})
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={prices[s] ?? ""}
                    onChange={(e) =>
                      setPrices((p) => ({
                        ...p,
                        [s]: e.target.value.replace(/[^\d.]/g, ""),
                      }))
                    }
                    placeholder="Leave empty for quote on request"
                    className="w-full rounded-ona-ctl border border-ona-border bg-ona-field px-3.5 py-3 text-[13px] text-ona-ink outline-none transition-colors focus:border-brand placeholder:text-ona-muted"
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom Save Changes CTA */}
        <div className="pt-8 pb-4">
          <button
            type="button"
            onClick={save}
            className="flex h-12 w-full items-center justify-center rounded-ona-card bg-[#ea580c] hover:bg-[#d94e08] active:scale-[0.99] font-bold text-sm text-white shadow-xs transition cursor-pointer"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
