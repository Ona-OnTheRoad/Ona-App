import { ProfileSection } from "@/components/profile/profile-shell";
import { BankChangeFlow } from "@/components/profile/security/bank-change-flow";
import type { UpdateUserProfile } from "@/components/profile/shared/types";
import { compressImageFile } from "@/lib/image-compress";
import { profileTheme } from "@/lib/profile-system";
import type { UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Payout (Tier 3) and CAC document sections (shown with Verification Mark). */
export function PayoutCacSections({
  isLight,
  userProfile,
  accessToken,
  updateUserProfile,
  setMsg,
  setErr,
}: {
  isLight: boolean;
  userProfile: UserProfile;
  accessToken: string;
  updateUserProfile: UpdateUserProfile;
  setMsg: (v: string | null) => void;
  setErr: (v: string | null) => void;
}) {
  const t = profileTheme(isLight);
  return (
    <>
      <ProfileSection title="Payout (Tier 3)" isLight={isLight}>
        <BankChangeFlow
          isLight={isLight}
          currentBank={{
            bankName: userProfile.bankName,
            bankAccountName: userProfile.bankAccountName,
            bankAccountNumber: userProfile.bankAccountNumber,
            bankCode: userProfile.bankCode,
          }}
          userPhone={userProfile.phone}
          accessToken={accessToken}
          onBankChanged={(b) => {
            updateUserProfile({
              bankName: b.bankName,
              bankAccountName: b.bankAccountName,
              bankAccountNumber: b.bankAccountNumber,
              bankCode: b.bankCode,
            });
          }}
        />
      </ProfileSection>

      <ProfileSection title="Business registration / CAC" isLight={isLight}>
        {userProfile.cacDocumentName ? (
          <p className={cn("text-[12px]", t.ink)}>
            Attached · {userProfile.cacDocumentName}
          </p>
        ) : (
          <p className={cn("text-[12px]", t.muted)}>No document uploaded.</p>
        )}
        <label className="mt-2 block">
          <span className="sr-only">Upload CAC document</span>
          <input
            type="file"
            accept="image/*,.pdf"
            className={cn(
              "w-full text-[12px]",
              isLight ? "text-slate-700" : "text-white/80",
            )}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const data = f.type.startsWith("image/")
                  ? await compressImageFile(f, { maxEdge: 1200 })
                  : await new Promise<string>((resolve) => {
                      const reader = new FileReader();
                      reader.onload = () =>
                        resolve(String(reader.result || ""));
                      reader.readAsDataURL(f);
                    });
                updateUserProfile({
                  cacDocumentName: f.name,
                  cacDocumentDataUrl: data,
                });
                setMsg("CAC document uploaded.");
              } catch {
                setErr("Could not upload document.");
              }
            }}
          />
        </label>
      </ProfileSection>
    </>
  );
}
