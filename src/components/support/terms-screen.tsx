"use client";

import { useRouter } from "next/navigation";
import { navigateBack } from "@/lib/navigation";
import { useApp } from "@/lib/store";
import { SupportScreenHeader } from "./support-screen-header";

export function TermsScreen() {
  const router = useRouter();
  const { accountType } = useApp();

  const handleBack = () => {
    navigateBack(router, "/settings/legal", accountType);
  };

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto px-4 pb-20 space-y-4">
        <SupportScreenHeader title="Terms of Service" onBack={handleBack} />

        <div className="pt-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ona-muted mb-4">
            ONA TERMS OF SERVICE (SUMMARY)
          </p>

          <div className="space-y-4 text-[12px] font-normal text-ona-ink leading-relaxed">
            <p>
              By using Ona you agree to book and provide services in good faith,
              provide accurate identity when required, and follow Nigerian law
              where applicable.
            </p>

            <p>
              Customers request help; Repair Pros may accept jobs when Live and
              verified. Escrow holds agreed labour until work is confirmed. Spare
              parts are never part of Ona labour prices.
            </p>

            <p>
              We may suspend accounts that fail verification, abuse the
              marketplace, or violate safety rules. Contact{" "}
              <a
                href="mailto:witcowavers@gmail.com"
                className="text-[#C70036] underline underline-offset-2"
              >
                witcowavers@gmail.com
              </a>{" "}
              for full legal copies or disputes.
            </p>

            <p className="pt-2 text-ona-muted">Last updated - 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
