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
}: {
  form: ProSignupForm;
  skill: ProService | null;
  specialty: string | null;
  vehiclesCanFix: VehiclesCanFix["vehiclesCanFix"];
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
    <div className="space-y-0 text-[12px]">
      <Row k="Name" v={fullName} />
      <Row k="Gender" v={formatGenderLabel(gender)} />
      <Row k="Date of birth" v={dateOfBirth || "Not set"} />
      <Row k="Business" v={businessName} />
      <Row k="Trade" v={skill ? PRO_SERVICE_LABELS[skill] : "Not set"} />
      <Row k="Focus" v={specialty || "Not set"} />
      <Row k="Phone" v={fullPhone} />
      <Row k="Email" v={email} />
      <Row k="NIN" v={idNumber} />
      <Row k="BVN" v={bvn ? "••••" + bvn.slice(-4) : "Not set"} />
      <Row k="Area" v={`${area}, ${city}`} />
      <Row k="Radius" v={`${serviceRadiusKm} km`} />
      {vehiclesCanFix.length > 0 && (
        <Row
          k="Vehicles you fix"
          v={vehiclesCanFix
            .map((v) =>
              [v.vehicleType, v.make, v.model, v.year].filter(Boolean).join(" "),
            )
            .join(" · ")}
        />
      )}
      {yearsExperience && (
        <Row k="Experience" v={experienceLabel(yearsExperience)} />
      )}
      {bio && <Row k="Bio" v={bio} />}
      {guarantorName && (
        <Row
          k="Guarantor"
          v={`${guarantorName} · ${guarantorPhone} · ${guarantorRelationship}`}
        />
      )}
    </div>
  );
}
