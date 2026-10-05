import { compressDocumentFile } from "@/lib/image-compress";
import { remainingFreeActions } from "@/lib/verification-gate";

/** ID photo -> data URL, compressed in the browser (see lib/image-compress). */
export const readFile = (file: File): Promise<string> =>
  compressDocumentFile(file);

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
