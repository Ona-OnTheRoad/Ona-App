import { profileTheme } from "@/lib/profile-system";
import { DOCS_PENDING_MAX_RADIUS_KM } from "@/lib/skill-questions";
import type { UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Under-review / rejected documents notice. */
export function ProDocsBanner({
  isLight,
  userProfile,
}: {
  isLight: boolean;
  userProfile: UserProfile;
}) {
  const t = profileTheme(isLight);
  if (!(
    userProfile.docsStatus === "under_review" ||
    userProfile.docsStatus === "none" ||
    userProfile.docsStatus === "rejected"
  ))
    return null;
  return (
    <div
      className={cn(
        "mb-3 border-b pb-3 text-[12px] font-semibold leading-snug",
        isLight ? "border-black/12" : "border-white/12",
        userProfile.docsStatus === "rejected"
          ? "text-red-500"
          : "text-[#FF6B35]",
      )}
    >
      <p className="font-black uppercase tracking-wide">
        {userProfile.docsStatus === "rejected"
          ? "Documents rejected"
          : "Under review"}
      </p>
      <p className={cn("mt-0.5 font-medium", t.muted)}>
        {userProfile.docsStatus === "rejected"
          ? "Your certification was not approved. Re-upload or contact support."
          : `Your documents are being checked. You stay visible only within ${DOCS_PENDING_MAX_RADIUS_KM} km until approved. After Tier 4 verification and approval you get +1 star instantly.`}
      </p>
      {userProfile.certificationFileName ? (
        <p className={cn("mt-1 text-[11px]", t.muted)}>
          File: {userProfile.certificationFileName}
        </p>
      ) : null}
    </div>
  );
}
