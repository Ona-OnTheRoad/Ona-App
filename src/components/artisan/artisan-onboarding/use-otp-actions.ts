import { sendArtisanOtp, verifyArtisanOtp } from "@/lib/artisan/verification";
import type { ArtisanVerificationProfile } from "@/lib/artisan/types";
import type { OnboardingState } from "./use-onboarding-state";

type Params = {
  profile: ArtisanVerificationProfile | null;
  otp: string;
  patch: OnboardingState["patch"];
  setOtp: OnboardingState["setOtp"];
  setOtpSent: OnboardingState["setOtpSent"];
  setMsg: OnboardingState["setMsg"];
  setErr: OnboardingState["setErr"];
  updateUserProfile: (partial: { phoneVerified: boolean }) => void;
};

/** Phone OTP send / verify (server first, local demo fallback) */
export function useOtpActions({
  profile,
  otp,
  patch,
  setOtp,
  setOtpSent,
  setMsg,
  setErr,
  updateUserProfile,
}: Params) {
  const sendOtp = async () => {
    if (!profile?.phone?.trim()) {
      setErr("Enter your phone number first.");
      return;
    }
    const phone = profile.phone.trim();
    // Server OTP (login path) so 336699 + phone_verified land on profiles
    try {
      const r = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "phone", target: phone }),
      });
      const json = (await r.json().catch(() => null)) as {
        ok?: boolean;
        error?: { message?: string };
      } | null;
      if (json?.ok) {
        // Keep local demo session in sync for offline/demo
        sendArtisanOtp(phone);
        setOtpSent(true);
        setOtp("");
        setMsg("OTP sent. Enter the code (demo 336699 when enabled).");
        setErr(null);
        return;
      }
      // Fall through to local if server rejects unregistered mid-signup
      if (json?.error?.message) {
        /* try local */
      }
    } catch {
      /* offline → local */
    }
    const res = sendArtisanOtp(phone);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setOtpSent(true);
    setOtp("");
    setMsg(
      `OTP sent. Code expires in ${Math.floor(res.expiresInSec / 60)} minutes.`,
    );
    setErr(null);
  };

  const verifyOtp = async () => {
    if (!profile) return;
    const phone = profile.phone.trim();
    // Prefer server profile-verify so phone_verified is unified with Customer
    try {
      const r = await fetch("/api/auth/otp/profile-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "phone",
          target: phone,
          code: otp,
        }),
      });
      const json = (await r.json().catch(() => null)) as {
        ok?: boolean;
        error?: { message?: string };
      } | null;
      if (json?.ok) {
        verifyArtisanOtp(phone, otp); // clear local session if any
        patch({
          tiers: { ...profile.tiers, tier1_phone: true },
        });
        updateUserProfile({ phoneVerified: true });
        setMsg("Phone verified. Tier 1 complete. Next: add your bank account.");
        setErr(null);
        return;
      }
      // If server says wrong code, still try local demo path
      const local = verifyArtisanOtp(phone, otp);
      if (!local.ok) {
        setErr(json?.error?.message || local.error);
        return;
      }
    } catch {
      const res = verifyArtisanOtp(phone, otp);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
    }
    patch({
      tiers: { ...profile.tiers, tier1_phone: true },
    });
    updateUserProfile({ phoneVerified: true });
    setMsg("Phone verified. Tier 1 complete. Next: add your bank account.");
    setErr(null);
  };

  return { sendOtp, verifyOtp };
}
