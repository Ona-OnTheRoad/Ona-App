"use client";

import { TechCard } from "@/components/technician/tech-card";
import { useT } from "@/lib/i18n";
import type { Technician } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PAGE_SIZE } from "@/components/home/home-panel/use-paged-technicians";

type ActiveJob = React.ComponentProps<typeof TechCard>["activeJob"];

/** Repair Pro market list (paged, scrolls inside the sheet). */
export function ProTechList({
  isLight,
  list,
  total,
  canShowMore,
  radiusKm,
  selectedTechId,
  jobsByPro,
  onSelect,
  onRequest,
  onOpenJob,
  onShowMore,
}: {
  isLight: boolean;
  list: Technician[];
  total: number;
  canShowMore: boolean;
  radiusKm: number;
  selectedTechId: string | null;
  jobsByPro: Record<string, ActiveJob>;
  onSelect: (id: string) => void;
  onRequest: (tech: Technician) => void;
  onOpenJob: (jobId: string) => void;
  onShowMore: () => void;
}) {
  const t = useT();
  return (
    <div
      className={cn(
        "min-h-full overflow-hidden rounded-t-lg",
        isLight ? "bg-[#d8dce4]/90 backdrop-blur-sm" : "bg-black",
      )}
      style={{ transform: "translateZ(0)" }}
    >
      <p
        className={cn(
          "px-3 pt-2 text-[10px] font-semibold uppercase tracking-wide",
          isLight ? "text-slate-600" : "text-white/55",
        )}
      >
        {t("home.nearbyCount", { total })}
      </p>
      {list.map((tech) => (
        <div
          key={tech.id}
          role="button"
          tabIndex={0}
          onClick={() => onSelect(tech.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(tech.id);
            }
          }}
          className="cursor-pointer outline-none"
        >
          <TechCard
            tech={tech}
            onRequest={onRequest}
            selected={selectedTechId === tech.id}
            activeJob={jobsByPro[tech.id] ?? null}
            onOpenJob={onOpenJob}
          />
        </div>
      ))}

      {canShowMore && (
        <button
          type="button"
          onClick={onShowMore}
          className={cn(
            "w-full border-0 py-2.5 text-[12px] font-bold",
            isLight
              ? "bg-transparent text-slate-700 hover:bg-slate-200/60"
              : "bg-transparent text-white/80 hover:bg-white/[0.04]",
          )}
        >
          {t("home.seeMore", { shown: list.length, total })}
        </button>
      )}

      {!canShowMore && total > PAGE_SIZE && (
        <p
          className={cn(
            "py-1.5 text-center text-[10px]",
            isLight ? "text-slate-400" : "text-white/45",
          )}
        >
          {t("home.showingAll", { total, km: radiusKm })}
        </p>
      )}
    </div>
  );
}
