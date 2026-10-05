import type { GovIdType } from "@/lib/artisan/types";
import { compressDocumentFile } from "@/lib/image-compress";

export function uid() {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Image/document photo -> data URL, compressed in the browser. Use fileToDataUrl for video. */
export function imageFileToDataUrl(file: File): Promise<string> {
  return compressDocumentFile(file);
}

/** Raw file -> data URL (no compression; use for video). */
export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = () => reject(new Error("read_failed"));
    r.readAsDataURL(file);
  });
}

export function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Read video duration in seconds (rejects if unreadable) */
export function getVideoDurationSec(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      const d = v.duration;
      URL.revokeObjectURL(url);
      if (!Number.isFinite(d) || d <= 0) reject(new Error("duration"));
      else resolve(d);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("meta"));
    };
    v.src = url;
  });
}

/** NIN / passport = front only; driver’s licence / voter’s card = front + back */
export const govIdNeedsBack = (type: GovIdType | null | undefined) =>
  type === "drivers_licence" || type === "voters_card";

export const reviewLabel = (s?: string | null) => {
  if (s === "submitted") return "Pending review";
  if (s === "approved") return "Approved";
  if (s === "rejected") return "Rejected · re-upload";
  return "Not submitted";
};

/** Local user id: backend id, else the cached local id, else "local-pro" */
export function resolveOnboardingUserId(backendUserId: string | null): string {
  return (
    backendUserId ||
    (typeof window !== "undefined"
      ? localStorage.getItem("ona-user-id") || "local-pro"
      : "local-pro")
  );
}
