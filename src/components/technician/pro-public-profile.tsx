"use client";

import { useRouter } from "next/navigation";
import { Clock3, Pencil, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicProfileHeaderBar } from "@/components/technician/pro-public-profile/header-bar";
import {
  experienceLabelFor,
  serviceFocusRows,
  statusTextFor,
} from "@/components/technician/pro-public-profile/helpers";
import { PublicIdentityCard } from "@/components/technician/pro-public-profile/identity-card";
import { PublicInfoSections } from "@/components/technician/pro-public-profile/info-sections";
import { publicProfileTheme } from "@/components/technician/pro-public-profile/theme";
import { publicSkillRows } from "@/lib/skill-questions";
import { PRO_SERVICE_LABELS } from "@/lib/services";
import type { Technician } from "@/lib/types";
import { cn, formatEta } from "@/lib/utils";

/**
 * Motorist-facing Repair Pro profile solid sheets on both toggles
 * (no transparent / glass panels).
 */
export function ProPublicProfile({
  tech,
  isLight = true,
  onRequest,
  backHref = "/",
  isOwnProfile = false,
}: {
  tech: Technician;
  isLight?: boolean;
  onRequest: () => void;
  backHref?: string;
  /** Signed-in pro viewing their own public card */
  isOwnProfile?: boolean;
}) {
  const router = useRouter();
  const skillLabel =
    PRO_SERVICE_LABELS[tech.serviceType] ?? tech.roleLabel ?? "Repair Pro";
  const skillRows = publicSkillRows(tech.serviceType, tech.skillAnswers);
  const photoSrc = tech.photo?.trim() || undefined;

  const serviceFocus = serviceFocusRows(tech);
  const experienceLabel = experienceLabelFor(tech);
  const statusText = statusTextFor(tech);

  const theme = publicProfileTheme(isLight);
  const { pageBg, page, muted } = theme;

  return (
    <div
      className={cn("flex h-full flex-col", page)}
      style={{ backgroundColor: pageBg }}
    >
      <PublicProfileHeaderBar
        tech={tech}
        isLight={isLight}
        theme={theme}
        skillLabel={skillLabel}
        backHref={backHref}
        isOwnProfile={isOwnProfile}
        router={router}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-1 overflow-y-auto px-3 pb-2 scrollbar-hide">
          <PublicIdentityCard
            tech={tech}
            isLight={isLight}
            theme={theme}
            skillLabel={skillLabel}
            photoSrc={photoSrc}
            statusText={statusText}
          />

          <PublicInfoSections
            tech={tech}
            isLight={isLight}
            theme={theme}
            skillLabel={skillLabel}
            skillRows={skillRows}
            experienceLabel={experienceLabel}
            serviceFocus={serviceFocus}
          />

          <p
            className={cn(
              "flex items-center justify-center gap-1 pb-1 text-center text-[10px]",
              muted,
            )}
          >
            <Clock3 className="h-3 w-3" />
            Typical reply ETA {formatEta(tech.etaMinutes)}
          </p>
        </div>

        {/* Sticky actions solid, no glass */}
        <div
          className={cn("shrink-0 space-y-1.5 px-3 pb-3 pt-2", page)}
          style={{ backgroundColor: pageBg }}
        >
          {isOwnProfile ? (
            <Button
              size="lg"
              className="h-11 w-full"
              onClick={() => router.push("/profile?edit=1")}
            >
              <Pencil className="h-4 w-4" />
              Edit my profile
            </Button>
          ) : (
            <Button size="lg" className="h-11 w-full" onClick={onRequest}>
              <Zap className="h-4 w-4" />
              Request assistance
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
