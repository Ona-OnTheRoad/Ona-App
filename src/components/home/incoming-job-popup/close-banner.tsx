import { Wrench, X } from "lucide-react";
import type { CloseBannerState } from "./types";

export function CloseBanner({
  closeBanner,
  isLight,
  onOpenJobs,
  onDismiss,
}: {
  closeBanner: CloseBannerState;
  isLight: boolean;
  onOpenJobs: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-[max(0.5rem,env(safe-area-inset-top))] z-[190] flex justify-center px-3"
      aria-live="polite"
    >
      <div
        className="pointer-events-auto w-full max-w-[300px] animate-[om-toast-in_0.32s_cubic-bezier(0.2,0.8,0.2,1)] rounded-sm px-3 py-2.5 backdrop-blur-xl"
        style={{
          backgroundColor: isLight
            ? "rgba(255,255,255,0.94)"
            : "rgba(28,28,30,0.94)",
          boxShadow: isLight
            ? "0 8px 28px rgba(0,0,0,0.12)"
            : "0 8px 28px rgba(0,0,0,0.45)",
        }}
      >
        <button
          type="button"
          className="flex w-full items-start gap-2.5 p-0 text-left"
          style={{ background: "transparent" }}
          onClick={onOpenJobs}
        >
          <div
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{
              backgroundColor: isLight
                ? "rgba(255,107,53,0.12)"
                : "rgba(255,107,53,0.18)",
            }}
            aria-hidden
          >
            <Wrench
              className="h-[18px] w-[18px]"
              style={{ color: "#FF6B35" }}
              strokeWidth={2}
            />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-center gap-1.5">
              <span
                className="truncate text-[13px] font-bold leading-tight tracking-[-0.01em]"
                style={{ color: isLight ? "#0f1419" : "#e7e9ea" }}
              >
                Ona
              </span>
              <span
                className="shrink-0 text-[11px] font-medium"
                style={{ color: isLight ? "#536471" : "#71767b" }}
              >
                · now
              </span>
              {closeBanner.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  loading="lazy"
                  decoding="async"
                  src={closeBanner.avatarUrl}
                  alt=""
                  className="ml-auto h-5 w-5 shrink-0 rounded-full object-cover"
                />
              ) : null}
            </div>
            <p
              className="mt-0.5 text-[13px] font-semibold leading-snug tracking-[-0.01em]"
              style={{ color: isLight ? "#0f1419" : "#e7e9ea" }}
            >
              {closeBanner.title}
            </p>
            <p
              className="mt-0.5 line-clamp-2 text-[12px] font-normal leading-snug"
              style={{ color: isLight ? "#536471" : "#71767b" }}
            >
              {closeBanner.body}
            </p>
          </div>
        </button>
        <button
          type="button"
          aria-label="Dismiss"
          className="absolute right-2 top-2 rounded-full p-1"
          style={{ color: isLight ? "#536471" : "#71767b" }}
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
