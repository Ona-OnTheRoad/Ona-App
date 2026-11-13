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

/**
 * Phone OTP send / verify. The server (Africa's Talking SMS) is the authority.
 * A local, offline demo path exists for development only: it is used when the
 * network is down or when the server gave no answer, and only where
 * isDemoOtpAllowed("phone") says so, never in production once live SMS is on.
 */
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
    const { isDemoOtpAllowed } = await import("@/lib/auth/demo-otp");
    const demoOk = isDemoOtpAllowed("phone");
    try {
      const r = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "phone", target: phone }),
      });
      const json = (await r.json().catch(() => null)) as {
        ok?: boolean;
        data?: { message?: string };
        error?: { message?: string };
      } | null;
      if (json?.ok) {
        if (demoOk) sendArtisanOtp(phone); // keep the offline dev session in sync
        setOtpSent(true);
        setOtp("");
        setMsg(json.data?.message || "Code sent. Enter it below.");
        setErr(null);
        return;
      }
      // The server answered with a reason (resend wait, daily limit, SMS could
      // not be delivered, number not registered): show it, never fake a send.
      if (json?.error?.message) {
        setErr(json.error.message);
        return;
      }
    } catch {
      /* network error, handled below */
    }
    if (!demoOk) {
      setErr("Could not send the code. Check your connection and try again.");
      return;
    }
    const res = sendArtisanOtp(phone);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setOtpSent(true);
    setOtp("");
    setMsg(
      `Code sent. It expires in ${Math.floor(res.expiresInSec / 60)} minutes.`,
    );
    setErr(null);
  };

  const verifyOtp = async () => {
    if (!profile) return;
    const phone = profile.phone.trim();
    const { isDemoOtpAllowed } = await import("@/lib/auth/demo-otp");
    const demoOk = isDemoOtpAllowed("phone");
    // Server profile-verify keeps phone_verified unified with the Customer side
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
        verifyArtisanOtp(phone, otp); // clear any local dev session
        patch({
          tiers: { ...profile.tiers, tier1_phone: true },
        });
        updateUserProfile({ phoneVerified: true });
        setMsg("Phone verified. Tier 1 complete. Next: add your bank account.");
        setErr(null);
        return;
      }
      if (!demoOk) {
        setErr(json?.error?.message || "Incorrect code. Try again.");
        return;
      }
      const local = verifyArtisanOtp(phone, otp);
      if (!local.ok) {
        setErr(json?.error?.message || local.error);
        return;
      }
    } catch {
      if (!demoOk) {
        setErr("Could not verify the code. Check your connection and try again.");
        return;
      }
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
