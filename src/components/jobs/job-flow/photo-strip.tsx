"use client";

import { useState } from "react";
import { PhotoLightbox } from "@/components/media/photo-lightbox";
import { avatarInitials } from "@/lib/brand";
import { cn } from "@/lib/utils";

/** Customer photos in a single non-scrolling row that shrinks to fit.
 * Tapping a thumbnail opens a full-screen lightbox (arrows + swipe + counter),
 * matching the incoming-job panel preview.
 * When no job photos: show customer profile picture in the placeholder slot. */
export function PhotoStrip({
  photos,
  isLight,
  profilePhotoUrl,
  profileName,
}: {
  photos: { id: string; url: string; name?: string | null }[];
  isLight: boolean;
  /** Customer profile picture fills the image placeholder when no job photos */
  profilePhotoUrl?: string | null;
  profileName?: string | null;
}) {
  const [lightbox, setLightbox] = useState<{
    photos: { id: string; url: string; name?: string | null }[];
    index: number;
  } | null>(null);

  const displayPhotos =
    photos.length > 0
      ? photos
      : profilePhotoUrl?.trim()
        ? [
            {
              id: "customer-profile",
              url: profilePhotoUrl.trim(),
              name: profileName?.trim() || "Customer",
            },
          ]
        : [];

  if (!displayPhotos.length) {
    // Empty visual placeholder (initials) when no photo at all
    return (
      <div className="mt-1 flex items-stretch gap-1.5 overflow-hidden">
        <div
          className={cn(
            "flex h-20 w-20 shrink-0 items-center justify-center rounded-lg text-[18px] font-black",
            isLight ? "bg-black/10 text-slate-700" : "bg-white/12 text-white",
          )}
          aria-label="Customer photo placeholder"
        >
          {avatarInitials(profileName, "CU")}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-1 flex items-stretch gap-1.5 overflow-hidden">
        {displayPhotos.map((p, i) => (
          <button
            key={p.id}
            type="button"
            aria-label={p.name || "View photo"}
            onClick={() => setLightbox({ photos: displayPhotos, index: i })}
            className="min-w-0 flex-1 basis-0 overflow-hidden rounded-lg border-0 p-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              loading="lazy"
              decoding="async"
              src={p.url}
              alt={p.name || "Job photo"}
              className="h-20 w-full object-cover"
            />
          </button>
        ))}
      </div>

      {lightbox && (
        <PhotoLightbox
          lightbox={lightbox}
          setLightbox={setLightbox}
          position="fixed"
          closeButtonClassName={isLight ? undefined : "bg-white/10"}
        />
      )}
    </>
  );
}
