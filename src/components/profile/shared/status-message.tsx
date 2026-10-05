import { cn } from "@/lib/utils";

/** Inline success / error line shown at the top of an own-profile screen. */
export function StatusMessage({
  msg,
  err,
}: {
  msg: string | null;
  err: string | null;
}) {
  if (!(msg || err)) return null;
  return (
    <p
      className={cn(
        "mb-3 text-[12px] font-semibold",
        err ? "text-red-500" : "text-emerald-600",
      )}
    >
      {err || msg}
    </p>
  );
}
