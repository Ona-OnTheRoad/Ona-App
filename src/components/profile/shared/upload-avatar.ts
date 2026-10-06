import { compressImageFile } from "@/lib/image-compress";

/** Compress and upload an avatar; reports the stored URL or an error message. */
export async function uploadProfileAvatar(
  file: File,
  accessToken: string,
  onUrl: (url: string) => void,
  onError: (message: string) => void,
): Promise<void> {
  try {
    const dataUrl = await compressImageFile(file, { maxEdge: 512 });
    const res = await (
      await import("@/lib/api-auth-headers")
    ).authFetch("/api/profile/upload-avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, imageDataUrl: dataUrl }),
    });
    const json = (await res.json()) as {
      ok?: boolean;
      data?: { url?: string };
      error?: { message?: string };
    };
    if (json?.ok && json.data?.url) {
      onUrl(json.data.url);
    } else {
      onError(json?.error?.message || "Could not upload image.");
    }
  } catch {
    onError("Could not process image.");
  }
}
