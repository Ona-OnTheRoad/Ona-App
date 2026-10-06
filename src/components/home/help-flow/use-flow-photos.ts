"use client";

import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { compressImageFile } from "@/lib/image-compress";
import type { JobMedia } from "@/lib/jobs/types";
import { useApp } from "@/lib/store";
import type { HelpFlowConfig } from "../help-flow-configs";

interface FlowPhotosArgs {
  config: HelpFlowConfig;
  photos: JobMedia[];
  setPhotos: Dispatch<SetStateAction<JobMedia[]>>;
  setFinalStep: Dispatch<SetStateAction<string>>;
  setError: Dispatch<SetStateAction<string | null>>;
  advanceTimerRef: MutableRefObject<number | null>;
  clearAdvanceTimer: () => void;
}

/** Photo picker handler: compress, append, and auto-advance to voice when enough. */
export function useFlowPhotos({
  config,
  photos,
  setPhotos,
  setFinalStep,
  setError,
  advanceTimerRef,
  clearAdvanceTimer,
}: FlowPhotosArgs) {
  const { backendUserId, userProfile } = useApp();

  /* ---- photos ----------------------------------------------------------- */
  const onPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = config.maxPhotos - photos.length;
    if (room <= 0) {
      setError("You can add up to 4 photos.");
      return;
    }
    setError(null);
    try {
      const next: JobMedia[] = [];
      for (const file of Array.from(files).slice(0, room)) {
        const dataUrl = await compressImageFile(file, { maxEdge: 1280 });
        next.push({
          id: `photo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          kind: "photo",
          url: dataUrl,
          name: file.name,
          mime: file.type,
          createdAt: new Date().toISOString(),
          uploadedBy: backendUserId || userProfile?.identityId || "guest",
        });
      }
      const total = photos.length + next.length;
      setPhotos((prev) => [...prev, ...next].slice(0, config.maxPhotos));
      clearAdvanceTimer();
      if (total >= config.minPhotos) {
        advanceTimerRef.current = window.setTimeout(() => {
          advanceTimerRef.current = null;
          setFinalStep((prev) => (prev === "photos" ? "voice" : prev));
        }, 1000);
      }
    } catch {
      setError("Could not process photo.");
    }
  };

  return { onPhotos };
}
