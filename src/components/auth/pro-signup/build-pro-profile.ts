import { needsVehiclesSignupStep } from "@/lib/artisan/catalog";
import type { SkillAnswerValue } from "@/lib/skill-questions";
import { normalizeDobIso, type SignupGender } from "@/lib/signup-validation";
import type { ProService, UserProfile } from "@/lib/types";
import type { ProSignupForm } from "./use-pro-signup-form";
import type { VehicleFocus } from "./use-vehicle-focus";
import type { VehiclesCanFix } from "./use-vehicles-can-fix";

type BuildInput = {
  form: ProSignupForm;
  focus: VehicleFocus;
  fixList: VehiclesCanFix["vehiclesCanFix"];
  skill: ProService;
  specialty: string;
  skillAnswers: Record<string, SkillAnswerValue>;
  refCode: string | undefined;
};

/** Assemble the Repair Pro UserProfile submitted by signup. */
export function buildProProfile({
  form,
  focus,
  fixList,
  skill,
  specialty,
  skillAnswers,
  refCode,
}: BuildInput): UserProfile {
  const certUpload = skillAnswers.certificationUpload as
    | { name?: string; dataUrl?: string; mime?: string }
    | undefined;
  const hasCert =
    certUpload &&
    typeof certUpload === "object" &&
    Boolean(certUpload.name || certUpload.dataUrl);
  const { vehicleBrands, vehicleModelsByBrand, vehicleType } = focus;

  return {
    accountType: "professional",
    fullName: form.fullName.trim(),
    name_locked: true,
    gender: form.gender as SignupGender,
    dateOfBirth:
      normalizeDobIso(form.dateOfBirth) || form.dateOfBirth.trim(),
    businessName: form.businessName.trim(),
    phone: form.fullPhone,
    email: form.email.trim(),
    password: form.password,
    city: form.city.trim(),
    area: form.area.trim(),
    services: [skill],
    serviceRadiusKm: form.serviceRadiusKm,
    yearsExperience: form.yearsExperience.trim() || undefined,
    bio: form.bio.trim() || undefined,
    idNumber: form.idNumber.trim() || undefined,
    bvn: form.bvn.trim() || undefined,
    // Only under_review when a cert was uploaded; no cert → full radius (admin can still verify)
    docsStatus: hasCert ? "under_review" : "none",
    docsRatingBoostApplied: false,
    certificationFileName: hasCert
      ? String(certUpload?.name || "certificate")
      : undefined,
    certificationFileDataUrl: hasCert
      ? String(certUpload?.dataUrl || "")
      : undefined,
    averageRating: 0,
    // Vehicles only for auto trades (or AC/Electric vehicle focus)
    ...(needsVehiclesSignupStep(skill, specialty)
      ? {
          servedVehicleType: fixList[0]?.vehicleType || vehicleType || undefined,
          servedBrand: fixList[0]?.make || vehicleBrands[0] || undefined,
          servedMake: fixList[0]?.make || vehicleBrands[0] || undefined,
          servedModel:
            fixList[0]?.model ||
            (vehicleBrands[0] && vehicleModelsByBrand[vehicleBrands[0]]?.length
              ? vehicleModelsByBrand[vehicleBrands[0]].join(", ")
              : undefined),
          vehiclesServedUpdatedAt: new Date().toISOString(),
        }
      : {}),
    servedCountry: focus.prefCountry,
    servedLocation: focus.prefLocation,
    skillAnswers: {
      ...skillAnswers,
      // Singular + array so discovery filters (Home/Office/…) always match
      specialty: specialty || "",
      specialties: specialty ? [specialty] : [],
      // Serialized list of vehicles this pro can fix (type/make/model/year)
      ...(needsVehiclesSignupStep(skill, specialty)
        ? {
            vehiclesCanFixJson: JSON.stringify(
              fixList.map((v) => ({
                vehicleType: v.vehicleType,
                make: v.make,
                model: v.model,
                year: v.year,
              })),
            ),
          }
        : {}),
    },
    guarantor: {
      fullName: form.guarantorName.trim(),
      phone: form.guarantorPhone.trim(),
      address: form.guarantorAddress.trim() || undefined,
      occupation: form.guarantorOccupation.trim() || undefined,
      relationship: form.guarantorRelationship.trim(),
    },
    registeredAt: new Date().toISOString(),
    refCode,
  };
}
