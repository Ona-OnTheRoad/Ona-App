"use client";

import { useRouter } from "next/navigation";
import { useAppConfig } from "@/components/app-config-provider";
import { ONA_BUILD_ID, ONA_BUILD_LABEL } from "@/lib/build-id";
import { navigateBack } from "@/lib/navigation";
import { useApp } from "@/lib/store";
import { SupportScreenHeader } from "./support-screen-header";

export function AboutOnaScreen() {
  const router = useRouter();
  const { accountType } = useApp();
  const { config } = useAppConfig();
  const version =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_VERSION) ||
    "0.1.0";

  const handleBack = () => {
    navigateBack(router, "/settings/sections/support", accountType);
  };

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto px-4 pb-20 space-y-4">
        <SupportScreenHeader title="About Ona" onBack={handleBack} />

        {/* Brand Card */}
        <div className="rounded-ona-card border border-ona-border bg-ona-surface p-6 shadow-xs text-center space-y-3">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white text-[22px] font-black shadow-sm">
              Ona
            </div>
          </div>

          <div>
            <p className="text-[18px] font-bold text-ona-ink">
              {config.app.name || "Ona"}
            </p>
            <p className="text-[12px] font-normal text-ona-muted mt-0.5">
              {config.app.tagline || "Automotive & Home Services On Demand"}
            </p>
          </div>

          <div className="pt-1">
            <span className="inline-block px-3 py-1 rounded-full bg-brand/10 text-brand text-[11px] font-medium">
              Version {version}
            </span>
          </div>

          <div className="pt-1 space-y-0.5">
            <p className="text-[10px] text-ona-muted tabular-nums">
              {ONA_BUILD_LABEL}
            </p>
            <p className="text-[9px] text-ona-muted/60 font-mono">
              {ONA_BUILD_ID}
            </p>
          </div>
        </div>

        {/* Overview Details Card */}
        <div className="rounded-ona-card border border-ona-border bg-ona-surface shadow-xs divide-y divide-ona-border overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <p className="text-[12px] font-medium text-ona-ink">Platform</p>
            <p className="text-[11px] font-normal text-ona-muted">
              Two-sided repair marketplace
            </p>
          </div>

          <div className="flex items-center justify-between p-4">
            <p className="text-[12px] font-medium text-ona-ink">Roles</p>
            <p className="text-[11px] font-normal text-ona-muted">
              Customers & Repair Pros
            </p>
          </div>

          <div className="flex items-center justify-between p-4">
            <p className="text-[12px] font-medium text-ona-ink">Care</p>
            <p className="text-[11px] font-normal text-ona-muted">
              {config.app.supportEmail || "witcowavers@gmail.com"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
