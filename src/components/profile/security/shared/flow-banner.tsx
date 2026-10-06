import { cn } from "@/lib/utils";

export function FlowBanner({
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
        "rounded-xl px-3 py-2 text-[12px] font-semibold",
        err
          ? "bg-red-500/15 text-red-400"
          : "bg-emerald-500/15 text-emerald-500",
      )}
    >
      {err || msg}
    </p>
  );
}
