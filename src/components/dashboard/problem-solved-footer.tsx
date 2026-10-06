import { cn } from "@/lib/utils";

export function ProblemSolvedFooter({
  count,
  ink,
  muted,
}: {
  count: number;
  ink: string;
  muted: string;
}) {
  return (
    <div className="mt-auto pt-8 pb-3 text-center">
      <p className={cn("text-[12px] font-semibold", muted)}>Problem Solved</p>
      <p className={cn("mt-0.5 text-[20px] font-bold tabular-nums", ink)}>
        {count}
      </p>
    </div>
  );
}
