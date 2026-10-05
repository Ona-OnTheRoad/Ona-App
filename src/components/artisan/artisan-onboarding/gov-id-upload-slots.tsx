import { Upload } from "lucide-react";
import { UploadInlinePreview } from "@/components/media/upload-inline-preview";
import { IMAGE_MAX_BYTES } from "@/lib/artisan/types";
import { cn } from "@/lib/utils";
import { imageFileToDataUrl, formatMb, govIdNeedsBack, uid } from "./helpers";
import type { FlashSetters, StepBaseProps } from "./types";

type Props = StepBaseProps & Pick<FlashSetters, "setErr" | "setBusy">;

/** Front (always) + Back (licence / voters only) ID photo uploads */
export function GovIdUploadSlots({
  profile,
  patch,
  styles,
  setErr,
  setBusy,
}: Props) {
  const { muted, isLight } = styles;
  return (
    <>
      {(
        [
          {
            side: "front" as const,
            label: govIdNeedsBack(profile.govIdType)
              ? "Upload front of ID"
              : "Upload photo of selected ID",
            media: profile.govIdFront,
            kind: "id_front" as const,
          },
          ...(govIdNeedsBack(profile.govIdType)
            ? [
                {
                  side: "back" as const,
                  label: "Upload back of ID",
                  media: profile.govIdBack,
                  kind: "id_back" as const,
                },
              ]
            : []),
        ] as const
      ).map((slot) => (
        <div key={slot.side} className="space-y-1.5">
          <label
            className={cn(
              "flex w-full min-h-[48px] cursor-pointer flex-col items-center justify-center gap-1 rounded-md px-3 py-3",
              isLight
                ? "bg-black/[0.06] text-slate-800"
                : "bg-white/[0.08] text-white",
              (profile.tiers.tier2_govId ||
                profile.govIdReviewStatus === "submitted") &&
                "pointer-events-none opacity-60",
            )}
          >
            <span className="flex items-center gap-2 text-[12px] font-bold">
              <Upload className="h-4 w-4 shrink-0 text-[#FF6B35]" />
              {slot.media
                ? `Uploaded: ${slot.media.name || slot.side}`
                : slot.label}
            </span>
            <span className={cn("text-[10px] font-medium", muted)}>
              Max {formatMb(IMAGE_MAX_BYTES)} · image only
              {govIdNeedsBack(profile.govIdType)
                ? ` · ${slot.side}`
                : " · front only"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={
                profile.tiers.tier2_govId ||
                profile.govIdReviewStatus === "submitted"
              }
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                if (f.size > IMAGE_MAX_BYTES) {
                  setErr(
                    `ID photo must be ${formatMb(IMAGE_MAX_BYTES)} or less.`,
                  );
                  return;
                }
                setBusy(true);
                try {
                  const url = await imageFileToDataUrl(f);
                  const media = {
                    id: uid(),
                    url,
                    kind: slot.kind,
                    name: f.name,
                    mime: f.type,
                    createdAt: new Date().toISOString(),
                  };
                  patch({
                    ...(slot.side === "front"
                      ? { govIdFront: media }
                      : { govIdBack: media }),
                    tiers: { ...profile.tiers, tier2_govId: false },
                    govIdReviewStatus: "none",
                  });
                  setErr(null);
                } catch {
                  setErr("Could not read ID photo.");
                } finally {
                  setBusy(false);
                }
              }}
            />
          </label>
          {slot.media?.url ? (
            <UploadInlinePreview
              url={slot.media.url}
              label={slot.side === "front" ? "ID front" : "ID back"}
              mime={slot.media.mime}
              fileName={slot.media.name}
              isLight={isLight}
              defaultOpen
            />
          ) : null}
        </div>
      ))}
    </>
  );
}
