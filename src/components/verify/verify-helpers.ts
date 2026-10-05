import { remainingFreeActions } from "@/lib/verification-gate";

export const readFile = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = () => reject(new Error("read_failed"));
    r.readAsDataURL(file);
  });

export function trialNote(
  profile:
    | {
        firstServiceAt?: string;
        serviceActionCount?: number;
      }
    | null
    | undefined,
): string {
  if (!profile?.firstServiceAt) return ".";
  const days = remainingFreeActions(profile as never);
  if (!Number.isFinite(days) || days <= 0) return ".";
  return ` · ${days} free day${days === 1 ? "" : "s"} left.`;
}
