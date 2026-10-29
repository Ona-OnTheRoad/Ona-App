"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Info } from "lucide-react";
import { navigateBack } from "@/lib/navigation";
import { useApp } from "@/lib/store";
import { SupportScreenHeader } from "./support-screen-header";

export function LegalHubScreen() {
  const router = useRouter();
  const { accountType } = useApp();

  const handleBack = () => {
    navigateBack(router, "/settings/sections/support", accountType);
  };

  const documentItems = [
    {
      title: "Terms of Service",
      subtitle: "Rules for using Ona",
      href: "/settings/legal/terms",
    },
    {
      title: "Privacy Policy",
      subtitle: "How we handle your data",
      href: "/settings/legal/privacy",
    },
  ];

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto px-4 pb-20 space-y-4">
        <SupportScreenHeader title="Legal" onBack={handleBack} />

        {/* Documents Card */}
        <div className="rounded-ona-card border border-ona-border dark:border-[#333E4F] bg-ona-surface dark:bg-transparent p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ona-muted mb-1">
            DOCUMENTS
          </p>

          <div className="divide-y divide-ona-border dark:divide-[#18181B]">
            {documentItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between py-3.5 first:pt-2.5 last:pb-1 group cursor-pointer"
              >
                <div className="min-w-0 pr-3">
                  <p className="text-[12px] font-medium text-ona-ink group-hover:text-brand transition-colors">
                    {item.title}
                  </p>
                  <p className="text-[11px] font-normal text-ona-muted mt-0.5 leading-snug">
                    {item.subtitle}
                  </p>
                </div>
                <ChevronRight
                  className="h-4 w-4 text-ona-muted shrink-0 group-hover:translate-x-0.5 transition-transform"
                  strokeWidth={2}
                />
              </Link>
            ))}
          </div>
        </div>

        {/* Questions Info Callout Card */}
        <div className="rounded-ona-card border border-ona-border bg-ona-field p-4 flex items-center gap-2.5 shadow-xs">
          <Info className="h-4.5 w-4.5 text-ona-ink shrink-0" strokeWidth={2} />
          <p className="text-[12px] font-normal text-ona-ink leading-relaxed">
            Questions:{" "}
            <a
              href="mailto:witcowavers@gmail.com"
              className="underline font-medium text-ona-ink hover:text-brand transition-colors"
            >
              witcowavers@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
