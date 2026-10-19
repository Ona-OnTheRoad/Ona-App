"use client";

import { TechCard } from "@/components/technician/tech-card";
import { useT } from "@/lib/i18n";
import type { Technician } from "@/lib/types";
import { PAGE_SIZE } from "@/components/home/home-panel/use-paged-technicians";

type ActiveJob = React.ComponentProps<typeof TechCard>["activeJob"];

/** Repair Pro market list (paged, scrolls inside the sheet). */
export function ProTechList({
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
      className="min-h-full overflow-hidden rounded-t-ona-card bg-ona-field"
      style={{ transform: "translateZ(0)" }}
    >
      <p className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-wide text-ona-muted">
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
          className="min-h-[44px] w-full border-0 bg-transparent py-2.5 text-[13px] font-bold text-ona-ink hover:bg-ona-field-strong"
        >
          {t("home.seeMore", { shown: list.length, total })}
        </button>
      )}

      {!canShowMore && total > PAGE_SIZE && (
        <p className="py-1.5 text-center text-[11px] text-ona-muted">
          {t("home.showingAll", { total, km: radiusKm })}
        </p>
      )}
    </div>
  );
}
