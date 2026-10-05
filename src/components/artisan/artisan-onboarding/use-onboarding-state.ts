import { useCallback, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ARTISAN_TRADE_CATALOG } from "@/lib/artisan/catalog";
import { saveArtisanProfile } from "@/lib/artisan/local-store";
import type {
  ArtisanOnboardingStep,
  ArtisanVerificationProfile,
} from "@/lib/artisan/types";
import type { UserProfile } from "@/lib/types";
import { useArtisanHydrate } from "./use-artisan-hydrate";

type Params = {
  mode: "full" | "settings";
  userId: string;
  displayName: string;
  userProfile: UserProfile | null;
};

/** All onboarding UI state, the hydrated profile and the `patch` writer */
export function useOnboardingState({
  mode,
  userId,
  displayName,
  userProfile,
}: Params) {
  const pathname = usePathname();
  const [step, setStep] = useState<ArtisanOnboardingStep>(
    mode === "settings" ? "optional_tiers" : "trade",
  );
  const [profile, setProfile] = useState<ArtisanVerificationProfile | null>(
    null,
  );
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [busy, setBusy] = useState(false);
  const [idBusy, setIdBusy] = useState<"gov" | "nin" | null>(null);
  const [showLiveness, setShowLiveness] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [toolDraft, setToolDraft] = useState("");
  /** Soft popup when pro tries to change locked primary trade */
  const [tradeLockOpen, setTradeLockOpen] = useState(false);
  /** Soft grey square popup for verification step locks */
  const [gatePopup, setGatePopup] = useState<string | null>(null);
  /** Custom ID-type menu (list has no border; closed field keeps hairline) */
  const [idTypeMenuOpen, setIdTypeMenuOpen] = useState(false);
  const idTypeWrapRef = useRef<HTMLDivElement>(null);
  const skillSectionRef = useRef<HTMLDivElement>(null);

  /** Signup primary trade locked for life of this onboarding/profile */
  const lockedPrimaryTrade = useMemo(() => {
    const fromProfile = userProfile?.services?.[0];
    if (
      fromProfile &&
      ARTISAN_TRADE_CATALOG.some((t) => t.service === fromProfile)
    ) {
      return fromProfile;
    }
    return null;
  }, [userProfile?.services]);

  useArtisanHydrate({
    userId,
    mode,
    pathname,
    displayName,
    userProfile,
    lockedPrimaryTrade,
    setProfile,
    setStep,
    setErr,
    setMsg,
  });

  const patch = useCallback((partial: Partial<ArtisanVerificationProfile>) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial, updatedAt: new Date().toISOString() };
      // Nested merges
      if (partial.tiers) next.tiers = { ...prev.tiers, ...partial.tiers };
      if (partial.trade) next.trade = { ...prev.trade, ...partial.trade };
      if (partial.serviceArea)
        next.serviceArea = { ...prev.serviceArea, ...partial.serviceArea };
      if (partial.guarantor)
        next.guarantor = { ...prev.guarantor, ...partial.guarantor };
      saveArtisanProfile(next);
      // TODO(api): await fetch("/api/artisan/profile", { method: "PATCH", body: JSON.stringify(next) })
      return next;
    });
  }, []);

  return {
    step,
    setStep,
    profile,
    setProfile,
    otp,
    setOtp,
    otpSent,
    setOtpSent,
    busy,
    setBusy,
    idBusy,
    setIdBusy,
    showLiveness,
    setShowLiveness,
    msg,
    setMsg,
    err,
    setErr,
    toolDraft,
    setToolDraft,
    tradeLockOpen,
    setTradeLockOpen,
    gatePopup,
    setGatePopup,
    idTypeMenuOpen,
    setIdTypeMenuOpen,
    idTypeWrapRef,
    skillSectionRef,
    lockedPrimaryTrade,
    patch,
  };
}

export type OnboardingState = ReturnType<typeof useOnboardingState>;
