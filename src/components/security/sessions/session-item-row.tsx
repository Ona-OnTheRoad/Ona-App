"use client";

import { Monitor, Smartphone, Trash2 } from "lucide-react";

export type SessionRowData = {
  id: string;
  device_label: string | null;
  user_agent: string | null;
  ip: string | null;
  last_seen_at: string | null;
  created_at: string | null;
};

interface SessionItemRowProps {
  session: SessionRowData;
  isBusy: boolean;
  onSignOut: (id: string) => void;
}

function parseBrowserAndIp(ua: string | null | undefined, ip: string | null | undefined) {
  let browser = "This browser";
  if (ua) {
    const match = ua.match(/(Chrome|Firefox|Safari|Edg|OPR|SamsungBrowser)\/[\d.]+/i);
    if (match) {
      browser = match[0].replace("Edg", "Edge").replace("OPR", "Opera");
    } else {
      browser = ua.slice(0, 30);
    }
  }
  const cleanIp = ip ? ip.replace(/^::ffff:/, "") : "";
  return cleanIp ? `${browser} - ${cleanIp}` : browser;
}

function formatLastActive(timestamp: string | null | undefined) {
  if (!timestamp) return "Active recently";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Active recently";
  return `Last active ${date.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  })}, ${date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })}`;
}

export function SessionItemRow({
  session,
  isBusy,
  onSignOut,
}: SessionItemRowProps) {
  const isMobile = /(iphone|android|mobile|ipad)/i.test(
    `${session.device_label || ""} ${session.user_agent || ""}`,
  );
  const browserAndIp = parseBrowserAndIp(session.user_agent, session.ip);
  const lastActiveText = formatLastActive(session.last_seen_at || session.created_at);

  return (
    <div className="flex items-center justify-between gap-3 py-4 border-b border-ona-border last:border-b-0">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {/* Device Icon in outline container */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ona-ctl border border-brand/30 bg-brand/5 text-brand mt-0.5">
          {isMobile ? (
            <Smartphone className="h-5 w-5" strokeWidth={1.8} />
          ) : (
            <Monitor className="h-5 w-5" strokeWidth={1.8} />
          )}
        </div>

        {/* Device info */}
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium text-ona-ink truncate">
            {session.device_label || "This browser"}
          </p>
          <p className="text-[11px] font-normal text-ona-muted mt-0.5 truncate">
            {browserAndIp}
          </p>
          <p className="text-[11px] font-normal text-ona-muted mt-0.5">
            {lastActiveText}
          </p>
        </div>
      </div>

      {/* Sign out button */}
      <button
        type="button"
        disabled={isBusy}
        onClick={() => onSignOut(session.id)}
        className="shrink-0 inline-flex items-center gap-1.5 rounded-ona-ctl border border-red-200 dark:border-red-900/40 bg-[#FEF0F2] dark:bg-[#FFF4F6] px-3 py-1.5 text-[12px] font-medium text-[#C70036] dark:text-[#C70070] hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50 cursor-pointer"
      >
        <Trash2 className="h-3.5 w-3.5 text-[#C70036]" strokeWidth={2.2} />
        <span>{isBusy ? "Signing out..." : "Sign out"}</span>
      </button>
    </div>
  );
}
