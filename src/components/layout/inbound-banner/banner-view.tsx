import { MessageCircle, Phone, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Banner } from "./seen-anchors";

export function BannerView({
  banner,
  isLight,
  onOpen,
  onDismiss,
}: {
  banner: NonNullable<Banner>;
  isLight: boolean;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-[190] flex justify-center px-3 pt-3"
      role="status"
      aria-live="polite"
    >
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "pointer-events-auto flex w-full max-w-[360px] items-start gap-3 rounded-2xl border px-3 py-3 text-left shadow-lg backdrop-blur-md",
          isLight
            ? "border-black/10 bg-white/95 text-slate-900"
            : "border-white/15 bg-[#1a1210]/95 text-white",
        )}
      >
        <span
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            banner.kind === "message"
              ? "bg-brand/20 text-brand"
              : "bg-emerald-500/20 text-emerald-400",
          )}
        >
          {banner.kind === "message" ? (
            <MessageCircle className="h-4 w-4" />
          ) : (
            <Phone className="h-4 w-4" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-bold leading-tight">
            {banner.title}
          </span>
          <span
            className={cn(
              "mt-0.5 block line-clamp-2 text-[11px] leading-snug",
              isLight ? "text-slate-600" : "text-white/65",
            )}
          >
            {banner.body}
          </span>
        </span>
        <span
          role="presentation"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className={cn(
            "mt-0.5 shrink-0 rounded-full p-1",
            isLight ? "text-slate-400" : "text-white/45",
          )}
        >
          <X className="h-3.5 w-3.5" />
        </span>
      </button>
    </div>
  );
}
