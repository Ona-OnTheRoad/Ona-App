"use client";

import { useRouter } from "next/navigation";
import { navigateBack } from "@/lib/navigation";
import { useApp } from "@/lib/store";
import { SupportScreenHeader } from "./support-screen-header";

export function PrivacyPolicyScreen() {
  const router = useRouter();
  const { accountType } = useApp();

  const handleBack = () => {
    navigateBack(router, "/settings/legal", accountType);
  };

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto px-4 pb-20 space-y-4">
        <SupportScreenHeader title="Privacy Policy" onBack={handleBack} />

        <div className="pt-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ona-muted mb-4">
            ONA PRIVACY POLICY (SUMMARY)
          </p>

          <div className="space-y-4 text-[12px] font-normal text-ona-ink leading-relaxed">
            <p>
              We collect account details (name, email, phone), location for
              matching, job and chat data, and verification documents for
              safety.
            </p>

            <p>
              Customer profiles stay private by default until needed for a
              booking. Bank details are for refunds (customers) or payouts
              (pros) in Nigeria only and are not shared with the other party as
              marketing data.
            </p>

            <p>
              You may request export or deletion of your account from Settings.
            </p>

            <p>
              Questions:{" "}
              <a
                href="mailto:witcowavers@gmail.com"
                className="text-[#C70036] underline underline-offset-2"
              >
                witcowavers@gmail.com
              </a>
              .
            </p>

            <p className="pt-2 text-ona-muted">Last updated . 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
