import { SheetSelect } from "@/components/ui/option-sheet";
import { BioField } from "@/components/profile/bio-field";
import { ProfileSection } from "@/components/profile/profile-shell";
import { RadiusMapPreview } from "@/components/profile/radius-map-preview";
import { SkillsChips } from "@/components/profile/skills-chips";
import {
  EXP_YEARS,
  formatExperience,
  profileTheme,
  SERVICE_RADIUS_OPTIONS_KM,
} from "@/lib/profile-system";
import type { ProService, UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ExperienceSection({
  isLight,
  userProfile,
  editing,
  canSetExperience,
  field,
  lockedField,
  years,
  setYears,
}: {
  isLight: boolean;
  userProfile: UserProfile;
  editing: boolean;
  canSetExperience: boolean;
  field: string;
  lockedField: string;
  years: string;
  setYears: (v: string) => void;
}) {
  return (
    <ProfileSection title="Experience" isLight={isLight}>
      {editing && canSetExperience ? (
        <SheetSelect
          bare
          title="Years of experience"
          className={field}
          value={years}
          placeholder="Select years…"
          onChange={setYears}
          options={EXP_YEARS.map((y) => ({
            value: String(y),
            label: formatExperience(y),
          }))}
        />
      ) : (
        <p className={lockedField}>
          {formatExperience(userProfile.yearsExperience)}
        </p>
      )}
    </ProfileSection>
  );
}

export function SkillSection({
  isLight,
  lockedSkills,
}: {
  isLight: boolean;
  lockedSkills: ProService[];
}) {
  return (
    <ProfileSection title="Skill" isLight={isLight}>
      <SkillsChips selected={lockedSkills} isLight={isLight} editable={false} />
    </ProfileSection>
  );
}

export function BioSection({
  isLight,
  userProfile,
  editing,
  bio,
  setBio,
}: {
  isLight: boolean;
  userProfile: UserProfile;
  editing: boolean;
  bio: string;
  setBio: (v: string) => void;
}) {
  const t = profileTheme(isLight);
  return (
    <ProfileSection title="Bio" isLight={isLight}>
      {editing ? (
        <BioField value={bio} onChange={setBio} isLight={isLight} />
      ) : (
        <p className={cn("text-[13px] leading-snug", t.soft)}>
          {(userProfile.bio || "No bio yet.").slice(0, 144)}
        </p>
      )}
    </ProfileSection>
  );
}

export function RadiusSection({
  isLight,
  editing,
  radiusKm,
  setRadiusKm,
  displayRadius,
}: {
  isLight: boolean;
  editing: boolean;
  radiusKm: number;
  setRadiusKm: (km: number) => void;
  displayRadius: number;
}) {
  const t = profileTheme(isLight);
  return (
    <ProfileSection title="Service radius" isLight={isLight}>
      <p className={cn("mb-2 text-[12px] font-semibold", t.ink)}>
        {displayRadius} km coverage
      </p>
      {editing ? (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {SERVICE_RADIUS_OPTIONS_KM.map((km) => (
            <button
              key={km}
              type="button"
              onClick={() => setRadiusKm(km)}
              className={cn(
                "rounded-full border-0 px-3 py-1.5 text-[11px] font-bold",
                radiusKm === km
                  ? "bg-brand text-white"
                  : isLight
                    ? "bg-black/8 text-slate-700"
                    : "bg-[#2c2c2e] text-white/75",
              )}
            >
              {km} km
            </button>
          ))}
        </div>
      ) : null}
      {/* Always show radius map (view + edit) */}
      <RadiusMapPreview
        radiusKm={displayRadius}
        isLight={isLight}
        className="mt-1"
      />
    </ProfileSection>
  );
}
