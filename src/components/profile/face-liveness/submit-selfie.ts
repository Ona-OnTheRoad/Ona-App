/**
 * Capture one frame after the challenge and ask the server to verify it.
 * The server's provider verdict is the only thing that sets Tier 3.
 */

const MAX_WIDTH = 640;

/** JPEG data URL of the current video frame, or null if none is available. */
export function captureSelfie(video: HTMLVideoElement | null): string | null {
  if (!video || !video.videoWidth || !video.videoHeight) return null;
  const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  try {
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return null;
  }
}

export type SubmitResult =
  | { ok: true }
  /** `countsAsFail`: the provider said no (counts toward the local lockout). */
  | { ok: false; message: string; countsAsFail: boolean };

export async function submitLivenessSelfie(body: {
  userId: string;
  selfie: string;
  challenges: string[];
  durationMs: number;
}): Promise<SubmitResult> {
  try {
    const { authFetch } = await import("@/lib/api-auth-headers");
    const res = await authFetch("/api/liveness/verify", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      data?: { recorded?: boolean };
      error?: { code?: string; message?: string };
    };
    if (res.ok && json.ok && json.data?.recorded === true) return { ok: true };
    return {
      ok: false,
      message:
        json.error?.message ||
        "Face verification did not complete. Please try again.",
      countsAsFail: json.error?.code === "liveness_failed",
    };
  } catch {
    return {
      ok: false,
      message: "Network error. Check your connection and try again.",
      countsAsFail: false,
    };
  }
}
