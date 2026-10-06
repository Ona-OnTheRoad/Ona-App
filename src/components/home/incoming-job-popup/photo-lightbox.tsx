import type { Dispatch, SetStateAction } from "react";
import { PhotoLightbox as SharedPhotoLightbox } from "@/components/media/photo-lightbox";
import type { LightboxState } from "./types";

/** Incoming-request panel photo viewer: fills the panel's positioned parent. */
export function PhotoLightbox({
  lightbox,
  setLightbox,
}: {
  lightbox: LightboxState;
  setLightbox: Dispatch<SetStateAction<LightboxState | null>>;
}) {
  return (
    <SharedPhotoLightbox
      lightbox={lightbox}
      setLightbox={setLightbox}
      position="absolute"
    />
  );
}
