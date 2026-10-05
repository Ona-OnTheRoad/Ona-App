import { Video } from "lucide-react";
import { UploadInlinePreview } from "@/components/media/upload-inline-preview";
import type { ArtisanMedia } from "@/lib/artisan/types";
import {
  INTRO_VIDEO_MAX_BYTES,
  INTRO_VIDEO_MAX_SEC,
  INTRO_VIDEO_MIN_SEC,
} from "@/lib/artisan/types";
import { cn } from "@/lib/utils";
import { fileToDataUrl, formatMb, getVideoDurationSec, uid } from "./helpers";
import type { FlashSetters, StepBaseProps } from "./types";

type Props = StepBaseProps & FlashSetters;

/** Step 6: optional intro video */
export function VideoStep({
  profile,
  patch,
  styles,
  setErr,
  setMsg,
  setBusy,
}: Props) {
  const { ink, soft, tipBox, uploadClass, isLight } = styles;
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Video className="h-5 w-5 text-[#FF6B35]" />
        <h2 className={cn("text-[15px] font-bold", ink)}>Video introduction</h2>
      </div>
      <div
        className={cn(
          "rounded-md px-3 py-2.5 text-[12px] font-medium leading-snug",
          tipBox,
        )}
      >
        Optional. Max {INTRO_VIDEO_MAX_SEC}s and{" "}
        {formatMb(INTRO_VIDEO_MAX_BYTES)}. A short video of you and your tools
        helps admins approve you faster.
      </div>
      <label className={cn("h-20", uploadClass)}>
        <span className={cn("text-[12px] font-bold", soft)}>
          {profile.introVideo
            ? `Uploaded: ${profile.introVideo.name || "video"}`
            : "Record or upload video"}
        </span>
        <input
          type="file"
          accept="video/*"
          capture="environment"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setBusy(true);
            setErr(null);
            try {
              if (f.size > INTRO_VIDEO_MAX_BYTES) {
                setErr(
                  `Video must be ${formatMb(INTRO_VIDEO_MAX_BYTES)} or less. This file is ${formatMb(f.size)}.`,
                );
                return;
              }
              const dur = await getVideoDurationSec(f);
              if (dur > INTRO_VIDEO_MAX_SEC + 0.25) {
                setErr(
                  `Video must be ${INTRO_VIDEO_MAX_SEC} seconds or less. This one is ${Math.ceil(dur)}s.`,
                );
                return;
              }
              if (dur < INTRO_VIDEO_MIN_SEC) {
                setErr("Video is too short to use.");
                return;
              }
              const url = await fileToDataUrl(f);
              const media: ArtisanMedia = {
                id: uid(),
                url,
                kind: "intro_video",
                name: f.name,
                mime: f.type,
                createdAt: new Date().toISOString(),
              };
              patch({ introVideo: media });
              setMsg("Intro video saved.");
            } catch {
              setErr("Could not read video. Try another file.");
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      {profile.introVideo ? (
        <div className="space-y-2">
          <UploadInlinePreview
            url={profile.introVideo.url}
            label="Intro video"
            mime={profile.introVideo.mime}
            fileName={profile.introVideo.name}
            isLight={isLight}
            defaultOpen
          />
          <button
            type="button"
            onClick={() => patch({ introVideo: null })}
            className="text-[12px] font-bold text-red-600"
          >
            Remove video
          </button>
        </div>
      ) : null}
    </section>
  );
}
