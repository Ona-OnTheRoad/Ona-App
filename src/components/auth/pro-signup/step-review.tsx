import { PRO_SERVICE_LABELS } from "@/lib/services";
import { formatGenderLabel } from "@/lib/signup-validation";
import type { ProService } from "@/lib/types";
import { experienceLabel } from "./constants";
import { Row } from "./field-parts";
import type { ProSignupForm } from "./use-pro-signup-form";
import type { VehiclesCanFix } from "./use-vehicles-can-fix";

/** Step 7: Review & create. */
export function StepReview({
  form,
  skill,
  specialty,
  vehiclesCanFix,
  isLight = true,
}: {
  form: ProSignupForm;
  skill: ProService | null;
  specialty: string | null;
  vehiclesCanFix: VehiclesCanFix["vehiclesCanFix"];
  isLight?: boolean;
}) {
  const {
    fullName,
    gender,
    dateOfBirth,
    businessName,
    fullPhone,
    email,
    idNumber,
    bvn,
    area,
    city,
    serviceRadiusKm,
    yearsExperience,
    bio,
    guarantorName,
    guarantorPhone,
    guarantorRelationship,
  } = form;
  return (
    <div className="space-y-0 text-[13px]">
      <Row k="Name" v={fullName} isLight={isLight} />
      <Row k="Gender" v={formatGenderLabel(gender)} isLight={isLight} />
      <Row k="Date of birth" v={dateOfBirth || "Not set"} isLight={isLight} />
      <Row k="Business" v={businessName} isLight={isLight} />
      <Row k="Trade" v={skill ? PRO_SERVICE_LABELS[skill] : "Not set"} isLight={isLight} />
      <Row k="Focus" v={specialty || "Not set"} isLight={isLight} />
      <Row k="Phone" v={fullPhone} isLight={isLight} />
      <Row k="Email" v={email} isLight={isLight} />
      <Row k="NIN" v={idNumber} isLight={isLight} />
      <Row k="BVN" v={bvn ? "••••" + bvn.slice(-4) : "Not set"} isLight={isLight} />
      <Row k="Area" v={`${area}, ${city}`} isLight={isLight} />
      <Row k="Radius" v={`${serviceRadiusKm} km`} isLight={isLight} />
      {vehiclesCanFix.length > 0 && (
        <Row
          k="Vehicles you fix"
          v={vehiclesCanFix
            .map((v) =>
              [v.vehicleType, v.make, v.model, v.year].filter(Boolean).join(" "),
            )
            .join(" · ")}
          isLight={isLight}
        />
      )}
      {yearsExperience && (
        <Row k="Experience" v={experienceLabel(yearsExperience)} isLight={isLight} />
      )}
      {bio && <Row k="Bio" v={bio} isLight={isLight} />}
      {guarantorName && (
        <Row
          k="Guarantor"
          v={`${guarantorName} · ${guarantorPhone} · ${guarantorRelationship}`}
          isLight={isLight}
        />
      )}
    </div>
  );
}
