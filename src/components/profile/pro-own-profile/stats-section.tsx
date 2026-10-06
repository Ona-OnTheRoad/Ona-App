import { ProfileSection } from "@/components/profile/profile-shell";
import { StatTile } from "@/components/profile/shared/stat-tile";
import { StarRatingDisplay } from "@/components/ui/star-rating";
import { profileTheme } from "@/lib/profile-system";
import type { UserProfile } from "@/lib/types";

export function ProStatsSection({
  isLight,
  userProfile,
  jobs,
}: {
  isLight: boolean;
  userProfile: UserProfile;
  jobs: number;
}) {
  const t = profileTheme(isLight);
  return (
    <ProfileSection title="Stats" isLight={isLight}>
      {userProfile.averageRating != null && (
        <div className="mb-2">
          <StarRatingDisplay
            rating={userProfile.averageRating}
            size="md"
            className={t.ink}
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-1.5 text-center sm:grid-cols-4">
        {[
          ["Jobs", jobs],
          ["Rating", userProfile.averageRating?.toFixed(1) ?? ""],
          [
            "Response",
            userProfile.avgResponseMinutes != null
              ? `${userProfile.avgResponseMinutes}m`
              : "Not set",
          ],
          [
            "Complete",
            userProfile.completionRate != null
              ? `${Math.round(userProfile.completionRate * 100)}%`
              : "Not set",
          ],
        ].map(([label, val]) => (
          <StatTile
            key={String(label)}
            isLight={isLight}
            label={String(label)}
            value={val}
            valueClass="text-[14px]"
          />
        ))}
      </div>
    </ProfileSection>
  );
}
