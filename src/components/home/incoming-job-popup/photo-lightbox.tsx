import { useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { LightboxState } from "./types";

export function PhotoLightbox({
  lightbox,
  setLightbox,
}: {
  lightbox: LightboxState;
  setLightbox: Dispatch<SetStateAction<LightboxState | null>>;
}) {
  /** Horizontal swipe origin (next/prev without closing). */
  const lightboxTouchX = useRef<number | null>(null);
  return (
    <div
      className="absolute inset-0 z-[200] flex items-center justify-center bg-black/90"
      role="dialog"
      aria-modal
      aria-label="Job photo"
      onClick={() => setLightbox(null)}
      onTouchStart={(e) => {
        lightboxTouchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        const start = lightboxTouchX.current;
        lightboxTouchX.current = null;
        if (start == null) return;
        const dx = e.changedTouches[0].clientX - start;
        if (Math.abs(dx) < 48) return;
        setLightbox((lb) => {
          if (!lb) return lb;
          const dir = dx < 0 ? 1 : -1;
          return {
            ...lb,
            index: (lb.index + dir + lb.photos.length) % lb.photos.length,
          };
        });
      }}
    >
      <button
        type="button"
        aria-label="Close photo"
        onClick={() => setLightbox(null)}
        className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] rounded-full border-0 p-2 text-white"
      >
        <X className="h-6 w-6" />
      </button>
      {lightbox.photos.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((lb) =>
                lb
                  ? {
                      ...lb,
                      index:
                        (lb.index - 1 + lb.photos.length) % lb.photos.length,
                    }
                  : lb,
              );
            }}
            className="absolute left-2 z-[201] rounded-full border-0 bg-white/10 p-2 text-white"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((lb) =>
                lb ? { ...lb, index: (lb.index + 1) % lb.photos.length } : lb,
              );
            }}
            className="absolute right-2 z-[201] rounded-full border-0 bg-white/10 p-2 text-white"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        loading="lazy"
        decoding="async"
        src={lightbox.photos[lightbox.index]?.url}
        alt={lightbox.photos[lightbox.index]?.name || "Job photo"}
        className="max-h-[80%] max-w-[90%] rounded-xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <p className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] text-[12px] font-semibold text-white/80">
        {lightbox.index + 1} / {lightbox.photos.length}
      </p>
    </div>
  );
}
