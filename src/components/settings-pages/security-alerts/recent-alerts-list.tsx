import { BellRing, KeyRound, LogIn, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AlertItem } from "./security-alerts-data";

const iconFor = (t: AlertItem["type"]) => {
  if (t === "login") return LogIn;
  if (t === "password") return KeyRound;
  if (t === "device") return ShieldAlert;
  return BellRing;
};

export function RecentAlertsList({
  feed,
  isLight,
  ink,
  muted,
  markAllRead,
}: {
  feed: AlertItem[];
  isLight: boolean;
  ink: string;
  muted: string;
  markAllRead: () => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between px-2">
        <p
          className={cn(
            "text-[10px] font-bold uppercase tracking-[0.14em]",
            muted,
          )}
        >
          Recent alerts
        </p>
        {feed.some((a) => !a.read) ? (
          <button
            type="button"
            onClick={markAllRead}
            className={cn(
              "border-0 bg-transparent text-[11px] font-bold",
              "text-brand",
            )}
          >
            Mark all read
          </button>
        ) : null}
      </div>
      {feed.length === 0 ? (
        <p className={cn("px-2 py-3 text-[12px] font-medium", muted)}>
          No security alerts yet.
        </p>
      ) : (
        <ul className="space-y-0.5">
          {feed.map((a) => {
            const Icon = iconFor(a.type);
            return (
              <li
                key={a.id}
                className={cn(
                  "flex gap-2 px-2 py-3",
                  !a.read && (isLight ? "bg-black/[0.03]" : "bg-white/[0.04]"),
                )}
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center">
                  <Icon className="h-4 w-4 text-brand" strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-[13px] font-bold", ink)}>{a.title}</p>
                  <p
                    className={cn(
                      "mt-0.5 text-[11px] font-medium leading-snug",
                      muted,
                    )}
                  >
                    {a.body}
                  </p>
                  <p className={cn("mt-1 text-[10px] font-medium", muted)}>
                    {new Date(a.at).toLocaleString()}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
