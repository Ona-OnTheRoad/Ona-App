import { proxyDocUrl } from "./doc-cache";

export type AdminDocKind =
  | "front"
  | "back"
  | "pro_front"
  | "pro_back"
  | "skill"
  | "selfie"
  | "cac"
  | "cert";

/** Build same-origin proxy URL so Care can open private storage / data URLs. */
export function adminDocViewHref(
  url: string | null | undefined,
  opts?: { userId?: string | null; kind?: AdminDocKind },
): string {
  if (!url && !(opts?.userId && opts?.kind)) return "";
  if (url && (url.startsWith("data:") || url.startsWith("blob:"))) return url;
  if (url) return proxyDocUrl(url, opts?.userId, opts?.kind);
  return `/api/admin/docs?userId=${encodeURIComponent(opts!.userId!)}&kind=${encodeURIComponent(opts!.kind!)}`;
}
