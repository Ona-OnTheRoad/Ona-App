"use client";

import { useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type LightboxPhoto = { id: string; url: string; name?: string | null };
export type LightboxState = { photos: LightboxPhoto[]; index: number };

/** Horizontal swipe distance (px) that counts as next/previous. */
const SWIPE_MIN_PX = 48;

/**
 * Full-screen photo viewer shared by the incoming-request panel and the job photo strip.
 * Close, previous and next are real buttons; the dialog also takes focus when it opens and
 * answers Escape and the arrow keys, so keyboard and switch users are not left behind it.
 * Tapping the dark backdrop closes it; tapping the photo does not. Swipe moves between photos.
 */
export function PhotoLightbox({
  lightbox,
  setLightbox,
  position,
  closeButtonClassName,
}: {
  lightbox: LightboxState;
  setLightbox: Dispatch<SetStateAction<LightboxState | null>>;
  /** "absolute" fills the nearest positioned parent; "fixed" fills the screen. */
  position: "absolute" | "fixed";
  closeButtonClassName?: string;
}) {
  const touchX = useRef<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Move focus into the dialog on open so Escape and the arrow keys work straight away.
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const step = (dir: 1 | -1) =>
    setLightbox((lb) =>
      lb
        ? { ...lb, index: (lb.index + dir + lb.photos.length) % lb.photos.length }
        : lb,
    );

  return (
    <div
      ref={dialogRef}
      className={cn(
        position,
        "inset-0 z-[200] flex items-center justify-center bg-black/90 outline-none",
      )}
      role="dialog"
      aria-modal
      aria-label="Job photo"
      tabIndex={-1}
      onClick={(e) => {
        // The photo itself must not close the viewer; everything else (backdrop, caption) does.
        if ((e.target as HTMLElement).tagName !== "IMG") setLightbox(null);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          setLightbox(null);
        } else if (lightbox.photos.length > 1 && e.key === "ArrowLeft") {
          step(-1);
        } else if (lightbox.photos.length > 1 && e.key === "ArrowRight") {
          step(1);
        }
      }}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        touchX.current = null;
        if (start == null) return;
        const dx = e.changedTouches[0].clientX - start;
        if (Math.abs(dx) < SWIPE_MIN_PX) return;
        step(dx < 0 ? 1 : -1);
      }}
    >
      <button
        type="button"
        aria-label="Close photo"
        onClick={() => setLightbox(null)}
        className={cn(
          "absolute right-4 top-[max(1rem,env(safe-area-inset-top))] rounded-full border-0 p-2 text-white",
          closeButtonClassName,
        )}
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
              step(-1);
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
              step(1);
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
      />
      <p className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] text-[12px] font-semibold text-white/80">
        {lightbox.index + 1} / {lightbox.photos.length}
      </p>
    </div>
  );
}
