import { FaceLiveness } from "@/components/profile/face-liveness";
import { ProfileSection } from "@/components/profile/profile-shell";
import {
  TierProgress,
  VerificationMark,
} from "@/components/profile/verification-mark";
import { hasVerificationMark, profileTheme } from "@/lib/profile-system";
import type { UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProVerificationSection({
  isLight,
  userProfile,
  showLiveness,
  setShowLiveness,
  onVerify,
  onLivenessPassed,
}: {
  isLight: boolean;
  userProfile: UserProfile;
  showLiveness: boolean;
  setShowLiveness: (v: boolean) => void;
  onVerify: () => void;
  onLivenessPassed: () => void;
}) {
  const t = profileTheme(isLight);
  return (
    <ProfileSection title="Verification" isLight={isLight}>
      <TierProgress profile={userProfile} isLight={isLight} />
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onVerify}
          className="text-[12px] font-bold text-brand"
        >
          NIN + BVN →
        </button>
        {!userProfile.faceLivenessVerified && (
          <button
            type="button"
            onClick={() => setShowLiveness(true)}
            className="text-[12px] font-bold text-brand"
          >
            Face liveness →
          </button>
        )}
      </div>
      {showLiveness && (
        <div className="mt-3">
          <FaceLiveness
            isLight={isLight}
            onCancel={() => setShowLiveness(false)}
            onPassed={onLivenessPassed}
          />
        </div>
      )}
      {hasVerificationMark(userProfile) && (
        <p
          className={cn(
            "mt-2 flex items-center gap-1 text-[12px] font-semibold",
            t.ink,
          )}
        >
          <VerificationMark profile={userProfile} /> Verification Mark active
        </p>
      )}
    </ProfileSection>
  );
}
