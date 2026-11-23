import { Camera } from "lucide-react";
import { FaceLiveness } from "@/components/profile/face-liveness";
import {
  canAccessLiveness,
  lockMessageForSection,
} from "@/lib/artisan/verification-order";
import type { UserProfile } from "@/lib/types";
import { uid } from "./helpers";
import { LockedTier } from "./locked-tier";
import type { FlashSetters, StepBaseProps } from "./types";

type Props = StepBaseProps &
  Pick<FlashSetters, "setErr" | "setMsg"> & {
    hidden: boolean;
    embedInSheet: boolean;
    showLiveness: boolean;
    setShowLiveness: (show: boolean) => void;
    setGatePopup: (message: string | null) => void;
    backendUserId: string | null;
    userProfile: UserProfile | null;
  };

/** Tier 3 face liveness (after Government ID) */
export function LivenessTier({
  profile,
  patch,
  styles,
  setErr,
  setMsg,
  hidden,
  embedInSheet,
  showLiveness,
  setShowLiveness,
  setGatePopup,
  backendUserId,
  userProfile,
}: Props) {
  const { panelClass, isLight } = styles;
  return (
    <LockedTier
      locked={!canAccessLiveness(profile)}
      hidden={hidden}
      lockMessage={lockMessageForSection("liveness")}
      onLockedClick={() => setGatePopup(lockMessageForSection("liveness"))}
      panelClass={panelClass}
    >
      {showLiveness ? (
        <div>
          <FaceLiveness
            isLight={isLight}
            userKey={
              backendUserId ||
              userProfile?.email ||
              userProfile?.phone ||
              "guest"
            }
            userId={backendUserId || undefined}
            serverVerify
            onCancel={() => setShowLiveness(false)}
            onPassed={() => {
              const passedAt = new Date().toISOString();
              patch({
                livenessPassed: true,
                livenessPassedAt: passedAt,
                tiers: { ...profile.tiers, tier3_liveness: true },
                selfie: profile.selfie || {
                  id: uid(),
                  url: "",
                  kind: "selfie",
                  name: "liveness-pass",
                  createdAt: passedAt,
                },
              });
              setShowLiveness(false);
              setMsg(
                "Face liveness passed. Complete BVN (Tier 3) for full T3 search reach.",
              );
              setErr(null);
              // The server already stored the verified pass (and recomputed
              // visibility) in /api/liveness/verify; refresh the cached profile.
              void import("@/lib/supabase/profile-cache")
                .then(({ invalidateProfileCache }) => invalidateProfileCache())
                .catch(() => undefined);
            }}
          />
        </div>
      ) : !embedInSheet ? (
        <button
          type="button"
          className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-md border-0 bg-[#323231] text-[13px] font-bold text-white"
          onClick={() => {
            setShowLiveness(true);
            setErr(null);
          }}
        >
          <Camera className="h-4 w-4" />
          {profile.tiers.tier3_liveness
            ? "Run liveness again"
            : "Start face liveness"}
        </button>
      ) : null}
    </LockedTier>
  );
}
