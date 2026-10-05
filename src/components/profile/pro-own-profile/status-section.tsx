import { AchievementBadgesRow } from "@/components/profile/achievement-badges";
import { ProfileSection } from "@/components/profile/profile-shell";
import { VerificationMark } from "@/components/profile/verification-mark";
import { profileTheme } from "@/lib/profile-system";
import type { UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Verification mark, badges, business name and online toggle. */
export function ProStatusSection({
  isLight,
  userProfile,
  jobs,
  editing,
  field,
  businessName,
  setBusinessName,
  proLive,
  liveBusy,
  onToggleLive,
}: {
  isLight: boolean;
  userProfile: UserProfile;
  jobs: number;
  editing: boolean;
  field: string;
  businessName: string;
  setBusinessName: (v: string) => void;
  proLive: boolean;
  liveBusy: boolean;
  onToggleLive: () => void;
}) {
  const t = profileTheme(isLight);
  return (
    <ProfileSection isLight={isLight}>
      <div className="flex items-center gap-1.5">
        <VerificationMark profile={userProfile} />
        <AchievementBadgesRow completedJobs={jobs} />
      </div>
      {editing ? (
        <input
          className={cn(field, "mt-3")}
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Business / workshop name"
        />
      ) : userProfile.businessName ? (
        <p className={cn("mt-2 text-[14px] font-semibold", t.ink)}>
          {userProfile.businessName}
        </p>
      ) : null}
      <div className="mt-3 flex items-center justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-[12px] font-bold",
            t.ink,
          )}
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              proLive ? "bg-emerald-500" : "bg-slate-400",
            )}
          />
          {proLive ? "Online" : "Offline"}
        </span>
        {!editing && (
          <button
            type="button"
            disabled={liveBusy}
            onClick={onToggleLive}
            className="border-0 bg-transparent text-[12px] font-bold text-[#FF6B35]"
          >
            {proLive ? "Go offline" : "Go online"}
          </button>
        )}
      </div>
    </ProfileSection>
  );
}
