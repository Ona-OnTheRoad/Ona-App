"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Mail } from "lucide-react";
import { useAppConfig } from "@/components/app-config-provider";
import { navigateBack } from "@/lib/navigation";
import { useApp } from "@/lib/store";
import { SupportScreenHeader } from "./support-screen-header";

const DEFAULT_SUPPORT_EMAIL = "support@ona.com";

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "How do I get help for my car or home?",
    a: "On Home, pick a trade (Mechanic, Plumber, A/C ... ), set your radius, then request a Live pro nearby. You can also help someone else by entering their address.",
  },
  {
    q: "Why am I asked to verify?",
    a: "Customers: verify phone (Tier 1), then upload ID (Tier 2) after free requests so we can keep the marketplace safe. Repair Pros: complete verification tiers so you can Go Live and appear in search.",
  },
  {
    q: "A request or job is stuck. What do I do?",
    a: "Open Requests or Jobs and check the status. If something looks wrong, message care below with your name, phone, and job details. We'll help from the backend.",
  },
  {
    q: "How do payments and escrow work?",
    a: "Agreed labour is held in escrow when a job is paid, then released when work is done and confirmed. Spare parts are never mixed into labour prices.",
  },
  {
    q: "I can't Go Live as a Repair Pro",
    a: "Finish required verification and wait for admin approval on ID / skill docs. Check Dashboard for your tier status, or write to care with your registered email.",
  },
];

export function SupportScreen() {
  const router = useRouter();
  const { displayName, userProfile, accountType } = useApp();
  const { config } = useAppConfig();
  const email =
    (config.app.supportEmail || DEFAULT_SUPPORT_EMAIL).trim() ||
    DEFAULT_SUPPORT_EMAIL;

  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);

  const roleLabel =
    accountType === "professional" ? "Repair Pro" : "Customer";

  const prefilled = useMemo(() => {
    const lines = [
      body.trim(),
      "",
      "",
      `Name: ${userProfile?.fullName || displayName || "Not set"}`,
      `Role: ${roleLabel}`,
      `Phone: ${userProfile?.phone || "Not set"}`,
      `Email: ${userProfile?.email || "Not set"}`,
    ];
    return lines.join("\n");
  }, [body, userProfile, displayName, roleLabel]);

  const handleBack = () => {
    navigateBack(router, "/settings/sections/support", accountType);
  };

  const handleSendToCare = () => {
    if (!body.trim()) return;
    const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
      "Help with Ona",
    )}&body=${encodeURIComponent(prefilled)}`;
    try {
      window.location.href = mailto;
      setSent(true);
    } catch {
      /* handled */
    }
  };

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="w-full max-w-lg mx-auto px-4 pb-20 space-y-4">
        <SupportScreenHeader
          title="Support"
          description="Quick answers below. Still stuck? Email care or send a short message. We reply from the Ona team."
          onBack={handleBack}
        />

        {/* Contact Card */}
        <div className="rounded-ona-card border border-ona-border dark:border-[#333E4F] bg-ona-surface dark:bg-transparent p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ona-muted mb-2">
            CONTACT
          </p>

          <a
            href={`mailto:${email}`}
            className="flex items-center justify-between gap-3 py-1 group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FEF0F2] text-[#FF6B35]">
                <Mail className="h-4.5 w-4.5" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-ona-ink group-hover:text-brand transition-colors">
                  Email Support
                </p>
                <p className="text-[11px] font-normal text-ona-muted mt-0.5">
                  {email}
                </p>
              </div>
            </div>
            <ChevronRight
              className="h-4 w-4 text-ona-muted shrink-0 group-hover:translate-x-0.5 transition-transform"
              strokeWidth={2}
            />
          </a>
        </div>

        {/* Common Questions Card */}
        <div className="rounded-ona-card border border-ona-border dark:border-[#333E4F] bg-ona-surface dark:bg-transparent p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ona-muted mb-1">
            COMMON QUESTIONS
          </p>

          <div className="divide-y divide-ona-border dark:divide-[#18181B]">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div key={item.q} className="py-3 first:pt-2.5 last:pb-1">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-3 text-left cursor-pointer group"
                  >
                    <span className="text-[12px] font-medium text-ona-ink group-hover:text-brand transition-colors">
                      {item.q}
                    </span>
                    <ChevronRight
                      className={`h-4 w-4 text-ona-muted shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-90 text-brand" : ""
                      }`}
                      strokeWidth={2}
                    />
                  </button>

                  {isOpen && (
                    <p className="text-[11px] font-normal text-ona-muted mt-2 leading-relaxed">
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Message Care Card */}
        <div className="rounded-ona-card border border-ona-border dark:border-[#333E4F] bg-ona-surface dark:bg-transparent p-4 shadow-xs space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ona-muted">
            MESSAGE CARE
          </p>

          <p className="text-[12px] font-medium text-ona-ink">Help with Ona</p>

          <textarea
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              setSent(false);
            }}
            placeholder="What do you need help with? Include job or account details if you can."
            className="w-full min-h-27.5 rounded-ona-ctl border border-ona-border bg-ona-field p-3 text-[12px] font-normal text-ona-ink placeholder:text-ona-muted/60 outline-none focus:outline-none transition-all resize-none"
          />

          {sent && (
            <p className="text-[11px] font-medium text-emerald-600">
              Opening your email client...
            </p>
          )}

          <button
            type="button"
            onClick={handleSendToCare}
            className={`w-full h-12 rounded-full font-medium text-[12px] flex items-center justify-center transition-all cursor-pointer ${
              body.trim()
                ? "bg-brand text-white shadow-xs hover:opacity-95 active:scale-[0.99]"
                : "bg-[#FFD3C4] text-white"
            }`}
          >
            Send to care
          </button>
        </div>
      </div>
    </div>
  );
}
