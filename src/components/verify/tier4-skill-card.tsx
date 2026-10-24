"use client";

import { ChevronRight, FileBadge, CheckCircle2 } from "lucide-react";

interface Tier4SkillCardProps {
  isLight?: boolean;
  status?: "locked" | "action_required" | "under_review" | "verified";
  onClick?: () => void;
}

export function Tier4SkillCard({
  status = "locked",
  onClick,
}: Tier4SkillCardProps) {
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={`rounded-ona-card border border-ona-border bg-ona-surface p-4 transition-all shadow-2xs ${
        isClickable
          ? "cursor-pointer hover:bg-black/1 dark:hover:bg-white/2"
          : "cursor-default"
      }`}
    >
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ona-muted">
          TIER 4
        </span>

        {status === "verified" ? (
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">
            <span>Verified</span>
            <CheckCircle2 className="h-4 w-4" strokeWidth={2.4} />
          </span>
        ) : status === "under_review" ? (
          <span className="text-[12px] font-semibold text-amber-500">
            Under review
          </span>
        ) : (
          <span className="text-[12px] font-semibold text-ona-muted">
            Locked
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ona-brand-soft text-brand">
            <FileBadge className="h-3.5 w-3.5" strokeWidth={2.4} />
          </div>
          <span className="text-[12px] font-medium leading-tight truncate text-ona-ink">
            Trade / Skill Certification proof
          </span>
        </div>

        <ChevronRight className="h-4 w-4 shrink-0 text-ona-muted" strokeWidth={2} />
      </div>
    </div>
  );
}
