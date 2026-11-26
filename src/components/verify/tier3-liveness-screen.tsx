"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Lock } from "lucide-react";
import { FaceLiveness } from "@/components/profile/face-liveness";
import { navigateBack } from "@/lib/navigation";
import { useApp } from "@/lib/store";
import { toastSuccess } from "@/lib/toast";
import { isIdentityVerified } from "@/lib/verification-gate";

/**
 * Tier 3 face liveness for Service Pros, opened from the /verify hub.
 * The pass is recorded by the server (/api/liveness/verify); this screen only
 * mirrors it locally and refreshes the cached profile.
 */
export function Tier3LivenessScreen() {
  const router = useRouter();
  const { theme, accountType, userProfile, backendUserId, updateUserProfile } =
    useApp();
  const isLight = theme === "light";
  const back = () => navigateBack(router, "/verify", accountType);

  const isPro = accountType === "professional";
  const tier2Ok = isIdentityVerified(userProfile);
  const done = Boolean(userProfile?.faceLivenessVerified);

  const onPassed = () => {
    updateUserProfile({
      faceLivenessVerified: true,
      faceLivenessAt: new Date().toISOString(),
    });
    void import("@/lib/supabase/profile-cache")
      .then(({ invalidateProfileCache }) => invalidateProfileCache())
      .catch(() => undefined);
    toastSuccess("Face liveness verified.");
    router.replace("/verify");
  };

  let body: React.ReactNode;
  if (!isPro) {
    body = (
      <Notice icon={<Lock className="h-4 w-4" />}>
        Face liveness is part of Service Pro verification.
      </Notice>
    );
  } else if (done) {
    body = (
      <Notice icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}>
        Face liveness is already verified.
      </Notice>
    );
  } else if (!tier2Ok) {
    body = (
      <Notice icon={<Lock className="h-4 w-4" />}>
        Tier 3 unlocks after Care approves your government ID (Tier 2).
      </Notice>
    );
  } else {
    body = (
      <>
        {!userProfile?.bvnVerified && (
          <p className="mb-3 text-[12px] text-ona-muted">
            Tier 3 search reach also needs your BVN. You can add it after this
            check.
          </p>
        )}
        <FaceLiveness
          isLight={isLight}
          userKey={
            backendUserId || userProfile?.email || userProfile?.phone || "guest"
          }
          userId={backendUserId || undefined}
          serverVerify
          onCancel={back}
          onPassed={onPassed}
        />
      </>
    );
  }

  return (
    <div className="ona2 flex h-full min-h-0 flex-col overflow-y-auto scrollbar-hide bg-ona-bg text-ona-ink">
      <div className="mx-auto w-full max-w-lg px-4 pb-8 pt-3">
        <div className="mb-3 flex items-center">
          <button
            type="button"
            onClick={back}
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-ona-ink transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Back to Verification"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>
        <h1 className="text-[20px] font-semibold tracking-tight text-ona-ink">
          Tier 3: Face liveness
        </h1>
        <p className="mb-5 mt-1 text-[13px] text-ona-muted">
          A short camera check. One photo is sent for verification; no video is
          saved.
        </p>
        {body}
      </div>
    </div>
  );
}

function Notice({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-ona-card border border-ona-border p-4 text-[13px] text-ona-ink">
      {icon}
      <span>{children}</span>
    </div>
  );
}
