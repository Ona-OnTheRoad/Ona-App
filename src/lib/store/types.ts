import type { AppFilters, ServiceCategory, ServiceRequest } from "@/lib/types";

/** Result of book (motorist) or accept (pro) with progressive verification. */
export type ServiceActionResult =
  | {
      ok: true;
      request?: ServiceRequest;
      warning: string | null;
      actionCount: number;
    }
  | {
      ok: false;
      code:
        | "verification_required"
        | "not_found"
        | "invalid"
        | "skill_mismatch"
        | "use_job_flow"
        | "transition_failed";
      message: string;
      actionCount: number;
    };

export type AppTheme = "light" | "dark";

export interface HomeUiSnapshot {
  category: ServiceCategory;
  radiusKm: number;
  filters: AppFilters;
  query: string;
  specialtyFilter: string | null;
  specialtyPickerOpen: boolean;
  selectedTechId: string | null;
  helpingSomeoneElse: boolean;
  helpingSomeoneLabel: string | null;
}
