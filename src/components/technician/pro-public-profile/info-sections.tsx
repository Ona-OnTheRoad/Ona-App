import { Briefcase, Car, MapPin, Navigation, Wrench, Zap } from "lucide-react";
import {
  Row,
  SolidSection,
} from "@/components/technician/pro-public-profile/parts";
import type { PublicProfileTheme } from "@/components/technician/pro-public-profile/theme";
import { isAutomotiveTrade } from "@/lib/artisan/catalog";
import type { Technician } from "@/lib/types";
import { cn, formatDistance } from "@/lib/utils";

type SkillRow = { label: string; value: string };

export function PublicInfoSections({
  tech,
  isLight,
  theme,
  skillLabel,
  skillRows,
  experienceLabel,
  serviceFocus,
}: {
  tech: Technician;
  isLight: boolean;
  theme: PublicProfileTheme;
  skillLabel: string;
  skillRows: SkillRow[];
  experienceLabel: string | null;
  serviceFocus: ReadonlyArray<readonly [string, string | undefined]>;
}) {
  const { card, cardBg, inset, insetBg, muted, soft } = theme;
  return (
    <>
      <SolidSection
        title="About"
        icon={Briefcase}
        isLight={isLight}
        card={card}
        cardBg={cardBg}
      >
        {experienceLabel ? (
          <Row label="Experience" value={experienceLabel} isLight={isLight} />
        ) : null}
        {tech.bio || tech.description ? (
          <p className={cn("text-[13px] leading-snug", soft)}>
            {tech.bio || tech.description}
          </p>
        ) : (
          <p className={cn("text-[12px]", muted)}>No bio yet.</p>
        )}
      </SolidSection>

      <SolidSection
        title={`${skillLabel} skill profile`}
        icon={Wrench}
        isLight={isLight}
        card={card}
        cardBg={cardBg}
      >
        {skillRows.length > 0 ? (
          skillRows.map((row) => (
            <Row
              key={row.label}
              label={row.label}
              value={row.value}
              isLight={isLight}
            />
          ))
        ) : (
          <p className={cn("text-[12px]", muted)}>
            Skill details appear when this pro finishes signup questions.
          </p>
        )}
      </SolidSection>

      {tech.specialties.length > 0 ? (
        <SolidSection
          title="What they can fix"
          icon={Zap}
          isLight={isLight}
          card={card}
          cardBg={cardBg}
        >
          <div className="flex flex-wrap gap-1.5">
            {tech.specialties.map((s) => (
              <span
                key={s}
                className={cn(
                  "rounded-lg px-2 py-1 text-[11px] font-semibold",
                  inset,
                  isLight ? "text-slate-800" : "text-neutral-200",
                )}
                style={isLight ? undefined : { backgroundColor: insetBg }}
              >
                {s}
              </span>
            ))}
          </div>
        </SolidSection>
      ) : null}

      {isAutomotiveTrade(tech.serviceType) ? (
        <SolidSection
          title="Vehicles they serve"
          icon={Car}
          isLight={isLight}
          card={card}
          cardBg={cardBg}
        >
          {serviceFocus.length > 0 ? (
            serviceFocus.map(([label, value]) => (
              <Row
                key={label}
                label={label}
                value={String(value)}
                isLight={isLight}
              />
            ))
          ) : (
            <p className={cn("text-[12px]", muted)}>
              Any vehicle · not specified yet
            </p>
          )}
        </SolidSection>
      ) : (
        <SolidSection
          title="Service focus"
          icon={Briefcase}
          isLight={isLight}
          card={card}
          cardBg={cardBg}
        >
          <p className={cn("text-[12px]", muted)}>
            Residential, Commercial & Industrial
          </p>
        </SolidSection>
      )}

      <SolidSection
        title="Service area"
        icon={MapPin}
        isLight={isLight}
        card={card}
        cardBg={cardBg}
      >
        <Row
          label="Coverage radius"
          value={`${tech.serviceRadiusKm} km`}
          isLight={isLight}
        />
        {tech.servedLocation && tech.servedLocation !== "Any" ? (
          <Row
            label="Focus region"
            value={tech.servedLocation}
            isLight={isLight}
          />
        ) : null}
        {tech.servedCountry && tech.servedCountry !== "Any" ? (
          <Row label="Country" value={tech.servedCountry} isLight={isLight} />
        ) : null}
        <p
          className={cn(
            "flex items-center gap-1 pt-0.5 text-[11px] font-medium",
            soft,
          )}
        >
          <Navigation className="h-3 w-3 text-brand" />
          Near you · {formatDistance(tech.distanceKm)} away
        </p>
      </SolidSection>
    </>
  );
}
