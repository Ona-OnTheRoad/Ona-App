import { ProfileSection } from "@/components/profile/profile-shell";
import { profileTheme } from "@/lib/profile-system";
import type { UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

export function GuarantorSection({
  isLight,
  userProfile,
  editing,
  field,
  gName,
  setGName,
  gPhone,
  setGPhone,
  gOccupation,
  setGOccupation,
  gAddress,
  setGAddress,
  gRelationship,
  setGRelationship,
}: {
  isLight: boolean;
  userProfile: UserProfile;
  editing: boolean;
  field: string;
  gName: string;
  setGName: (v: string) => void;
  gPhone: string;
  setGPhone: (v: string) => void;
  gOccupation: string;
  setGOccupation: (v: string) => void;
  gAddress: string;
  setGAddress: (v: string) => void;
  gRelationship: string;
  setGRelationship: (v: string) => void;
}) {
  const t = profileTheme(isLight);
  return (
    <ProfileSection title="Guarantor" isLight={isLight}>
      {editing ? (
        <div className="space-y-2">
          <input
            className={field}
            placeholder="Full name"
            value={gName}
            onChange={(e) => setGName(e.target.value)}
          />
          <input
            className={field}
            placeholder="Phone"
            value={gPhone}
            onChange={(e) =>
              setGPhone(e.target.value.replace(/\D/g, "").slice(0, 15))
            }
          />
          <input
            className={field}
            placeholder="Occupation"
            value={gOccupation}
            onChange={(e) => setGOccupation(e.target.value)}
          />
          <input
            className={field}
            placeholder="Residential address"
            value={gAddress}
            onChange={(e) => setGAddress(e.target.value)}
          />
          <input
            className={field}
            placeholder="Relationship to you"
            value={gRelationship}
            onChange={(e) => setGRelationship(e.target.value)}
          />
        </div>
      ) : (
        <div className={cn("space-y-1 text-[12px]", t.ink)}>
          <p>{userProfile.guarantor?.fullName || "Not set"}</p>
          <p className={t.muted}>{userProfile.guarantor?.phone || "Not set"}</p>
          {userProfile.guarantor?.occupation && (
            <p className={t.muted}>{userProfile.guarantor.occupation}</p>
          )}
          {userProfile.guarantor?.relationship && (
            <p className={t.muted}>{userProfile.guarantor.relationship}</p>
          )}
        </div>
      )}
    </ProfileSection>
  );
}
