import { ProfileSection } from "@/components/profile/profile-shell";
import { TierProgress } from "@/components/profile/verification-mark";
import { DOCS_PENDING_MAX_RADIUS_KM } from "@/lib/skill-questions";
import type { UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MotoristVerificationSection({
  isLight,
  userProfile,
  onContinue,
}: {
  isLight: boolean;
  userProfile: UserProfile;
  onContinue: () => void;
}) {
  return (
    <ProfileSection title="Verification" isLight={isLight}>
      <TierProgress profile={userProfile} isLight={isLight} />
      {(userProfile?.docsStatus === "under_review" ||
        userProfile?.docsStatus === "none" ||
        userProfile?.docsStatus === "rejected") && (
        <div
          className={cn(
            "mt-2 rounded-xl px-3 py-2.5 text-[12px] font-semibold leading-snug",
            userProfile.docsStatus === "rejected"
              ? "bg-red-500/15 text-red-500"
              : isLight
                ? "bg-[#FF6B35]/15 text-[#a14500]"
                : "bg-[#FF6B35]/20 text-[#FF6B35]",
          )}
        >
          <p className="font-black uppercase tracking-wide">
            {userProfile.docsStatus === "rejected"
              ? "Documents rejected"
              : "Under review"}
          </p>
          <p className="mt-0.5 font-medium opacity-90">
            {userProfile.docsStatus === "rejected"
              ? "Your certification was not approved. Re-upload or contact support."
              : `Your documents are being checked. You stay visible only within ${DOCS_PENDING_MAX_RADIUS_KM} km until approved. After Tier 4 verification and approval you get +1 star instantly.`}
          </p>
          {userProfile.certificationFileName ? (
            <p className="mt-1 text-[11px] opacity-80">
              File: {userProfile.certificationFileName}
            </p>
          ) : null}
        </div>
      )}
      <button
        type="button"
        onClick={onContinue}
        className={cn(
          "mt-2 text-[12px] font-bold",
          isLight ? "text-slate-900" : "text-white",
        )}
      >
        Continue verification →
      </button>
    </ProfileSection>
  );
}
