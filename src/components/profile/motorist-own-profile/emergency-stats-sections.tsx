import { ProfileSection } from "@/components/profile/profile-shell";
import { StatTile } from "@/components/profile/shared/stat-tile";
import { profileTheme } from "@/lib/profile-system";
import type { UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

export function EmergencyContactSection({
  isLight,
  userProfile,
  editing,
  field,
  emName,
  setEmName,
  emPhone,
  setEmPhone,
}: {
  isLight: boolean;
  userProfile: UserProfile;
  editing: boolean;
  field: string;
  emName: string;
  setEmName: (v: string) => void;
  emPhone: string;
  setEmPhone: (v: string) => void;
}) {
  const t = profileTheme(isLight);
  return (
    <ProfileSection title="Emergency contact" isLight={isLight}>
      {editing ? (
        <div className="space-y-2">
          <input
            className={field}
            placeholder="Name"
            value={emName}
            onChange={(e) => setEmName(e.target.value)}
          />
          <input
            className={field}
            placeholder="Phone"
            value={emPhone}
            onChange={(e) => setEmPhone(e.target.value)}
          />
        </div>
      ) : (
        <p className={cn("text-[12px]", t.ink)}>
          {userProfile.emergencyContact?.name || "Not set"}
          {userProfile.emergencyContact?.phone
            ? ` · ${userProfile.emergencyContact.phone}`
            : ""}
        </p>
      )}
    </ProfileSection>
  );
}

export function MotoristStatsSection({
  isLight,
  jobsRequested,
  jobsCompleted,
  ratingGiven,
}: {
  isLight: boolean;
  jobsRequested: number;
  jobsCompleted: number;
  ratingGiven: number;
}) {
  return (
    <ProfileSection title="Your stats" isLight={isLight}>
      <div className="grid grid-cols-3 gap-1.5 text-center">
        {[
          ["Requested", jobsRequested],
          ["Completed", jobsCompleted],
          ["Avg given", ratingGiven ? ratingGiven.toFixed(1) : "Not set"],
        ].map(([label, val]) => (
          <StatTile
            key={String(label)}
            isLight={isLight}
            label={String(label)}
            value={val}
            valueClass="text-[15px]"
          />
        ))}
      </div>
    </ProfileSection>
  );
}
