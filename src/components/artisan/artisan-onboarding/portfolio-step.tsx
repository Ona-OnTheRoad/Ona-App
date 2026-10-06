import { Camera, Upload } from "lucide-react";
import { UploadInlinePreview } from "@/components/media/upload-inline-preview";
import {
  IMAGE_MAX_BYTES,
  PORTFOLIO_MAX,
  PORTFOLIO_MIN,
} from "@/lib/artisan/types";
import { cn } from "@/lib/utils";
import { imageFileToDataUrl, formatMb, uid } from "./helpers";
import { ReqStar } from "./req-star";
import type { FlashSetters, StepBaseProps } from "./types";

type Props = StepBaseProps & FlashSetters;

/** Step 5: portfolio photos */
export function PortfolioStep({
  profile,
  patch,
  styles,
  setErr,
  setMsg,
  setBusy,
}: Props) {
  const { ink, muted, soft, isLight } = styles;

  const addPortfolio = async (files: FileList | null) => {
    if (!files?.length || !profile) return;
    setBusy(true);
    setErr(null);
    try {
      const next = [...profile.portfolio];
      for (const f of Array.from(files)) {
        if (next.length >= PORTFOLIO_MAX) break;
        if (!f.type.startsWith("image/")) continue;
        if (f.size > IMAGE_MAX_BYTES) {
          setErr(
            `Each image must be ${formatMb(IMAGE_MAX_BYTES)} or less. “${f.name}” is ${formatMb(f.size)}.`,
          );
          continue;
        }
        const url = await imageFileToDataUrl(f);
        next.push({
          id: uid(),
          url,
          kind: "portfolio",
          name: f.name,
          mime: f.type,
          createdAt: new Date().toISOString(),
        });
      }
      patch({ portfolio: next });
      if (next.length >= PORTFOLIO_MIN) setMsg(null);
    } catch {
      setErr("Could not read photo. Try a smaller image.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Camera className="h-5 w-5 text-[#FF6B35]" />
        <h2 className={cn("text-[15px] font-bold", ink)}>
          Portfolio
          <ReqStar />
        </h2>
      </div>
      <p className={cn("text-[12px]", muted)}>
        Upload {PORTFOLIO_MIN}-{PORTFOLIO_MAX} clear photos of previous jobs.
        Each image max {formatMb(IMAGE_MAX_BYTES)}.
      </p>
      <label
        className={cn(
          "flex h-24 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed",
          isLight
            ? "border-black/15 bg-black/[0.06]"
            : "border-white/20 bg-white/[0.08]",
        )}
      >
        <Upload
          className={cn(
            "h-5 w-5",
            isLight ? "text-slate-500" : "text-[#a1a1a6]",
          )}
        />
        <span className={cn("mt-1 text-[12px] font-bold", soft)}>
          Add photos ({profile.portfolio.length}/{PORTFOLIO_MAX})
        </span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => void addPortfolio(e.target.files)}
        />
      </label>
      <div className="grid grid-cols-3 gap-2">
        {profile.portfolio.map((m) => (
          <div
            key={m.id}
            className="relative aspect-square overflow-hidden rounded-md bg-black/10"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              loading="lazy"
              decoding="async"
              src={m.url}
              alt=""
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() =>
                patch({
                  portfolio: profile.portfolio.filter((x) => x.id !== m.id),
                })
              }
              className="absolute right-1 top-1 rounded bg-black/70 px-1.5 text-[10px] font-bold text-white"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      {profile.portfolio.length > 0 ? (
        <div className="space-y-2">
          {profile.portfolio.map((m, i) => (
            <UploadInlinePreview
              key={`pv-${m.id}`}
              url={m.url}
              label={`Photo ${i + 1}`}
              mime={m.mime}
              fileName={m.name}
              isLight={isLight}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
