/**
 * Client-side image compress for avatar / vehicle uploads, and for document photos
 * (government ID, skill documents, portfolio). A phone photo is often 3-6 MB; on a slow or
 * metered connection that is minutes of upload and the ID route drops anything over ~1.5 MB,
 * so photos are shrunk in the browser before they are sent.
 */

export async function compressImageFile(
  file: File,
  opts?: { maxEdge?: number; quality?: number },
): Promise<string> {
  // Data-saver defaults avatars / vehicle photos stay sharp enough
  const maxEdge = opts?.maxEdge ?? 480;
  const quality = opts?.quality ?? 0.72;

  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);

  let { width, height } = img;
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = () => reject(new Error("Could not read image"));
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Invalid image"));
    img.src = src;
  });
}

/** Document photos keep more detail than avatars so IDs stay legible. */
const DOC_MAX_EDGE = 1600;
const DOC_QUALITY = 0.8;
/** Below this size re-encoding saves little and only adds artefacts. */
const DOC_SKIP_BELOW_BYTES = 250 * 1024;
const DOC_TIMEOUT_MS = 15_000;

/**
 * Data URL for a document / ID / portfolio photo, compressed when that helps.
 * Non-images (PDF), animated or vector images, small files and any failure fall back to the
 * original file, so a photo is never lost to compression.
 */
export async function compressDocumentFile(file: File): Promise<string> {
  const type = (file.type || "").toLowerCase();
  const compressible =
    type.startsWith("image/") &&
    type !== "image/gif" &&
    type !== "image/svg+xml" &&
    file.size > DOC_SKIP_BELOW_BYTES;
  if (!compressible) return readFileAsDataUrl(file);

  try {
    const shrunk = await Promise.race([
      compressImageFile(file, { maxEdge: DOC_MAX_EDGE, quality: DOC_QUALITY }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("compress_timeout")), DOC_TIMEOUT_MS),
      ),
    ]);
    // Keep the original if compression somehow made it bigger (rare, tiny PNG screenshots).
    return shrunk && shrunk.length > 0 ? shrunk : readFileAsDataUrl(file);
  } catch {
    return readFileAsDataUrl(file);
  }
}
