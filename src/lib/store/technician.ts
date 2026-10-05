import { DEFAULT_USER_LOCATION } from "@/lib/data/technicians";
import { DEFAULT_RADIUS_KM } from "@/lib/matching";
import { isProService, PRO_SERVICE_LABELS } from "@/lib/pro-service-id";
import type { Technician, UserProfile } from "@/lib/types";
import { SELF_PRO_TECH_ID } from "./constants";

/** Map a Repair Pro UserProfile into a directory Technician card. */
export function profileToTechnician(profile: UserProfile): Technician | null {
  if (profile.accountType !== "professional") return null;
  const services = (profile.services ?? []).filter(isProService);
  const primary = services[0] ?? "mechanic";
  const name = profile.fullName.trim() || "Repair Professional";
  const short =
    name.split(/\s+/).length >= 2
      ? `${name.split(/\s+/)[0]} ${name.split(/\s+/).at(-1)?.[0] ?? ""}.`
      : name;
  const label = PRO_SERVICE_LABELS[primary] ?? "Repair Pro";
  const brand = profile.servedBrand || profile.servedMake;
  const focusBits = [
    profile.servedVehicleType,
    brand && brand !== "Any" ? brand : null,
    profile.servedModel && profile.servedModel !== "Any"
      ? profile.servedModel
      : null,
    profile.servedCountry && profile.servedCountry !== "Any"
      ? profile.servedCountry
      : null,
  ].filter(Boolean);
  const focusLine =
    focusBits.length > 0
      ? `Serves ${focusBits.join(" · ")}.`
      : "Roadside repair professional.";
  const skillAns = (profile.skillAnswers || {}) as Record<string, unknown>;
  const specialtyAns = skillAns.specialties;
  const specialtyOne = skillAns.specialty;
  const specialtiesFromSignup = (() => {
    const out: string[] = [];
    if (Array.isArray(specialtyAns)) {
      for (const s of specialtyAns) {
        if (typeof s === "string" && s.trim()) out.push(s.trim());
      }
    } else if (typeof specialtyAns === "string" && specialtyAns.trim()) {
      out.push(specialtyAns.trim());
    }
    if (typeof specialtyOne === "string" && specialtyOne.trim()) {
      if (
        !out.some((x) => x.toLowerCase() === specialtyOne.trim().toLowerCase())
      ) {
        out.unshift(specialtyOne.trim());
      }
    }
    return out;
  })();
  return {
    id: SELF_PRO_TECH_ID,
    name,
    shortName: short,
    serviceType: primary,
    roleLabel: label,
    photo: profile.avatarUrl || "/technicians/t1.jpg",
    rating:
      profile.averageRating && profile.averageRating > 0
        ? profile.averageRating
        : 0,
    reviewCount: profile.jobsCompleted ?? 0,
    jobsCompleted: profile.jobsCompleted ?? 0,
    distanceKm: 0.2,
    etaMinutes: 6,
    status: "available",
    // Blue tick only Tier 4 skill-verified pros
    verified: profile.docsStatus === "approved",
    fastResponse: true,
    specialties:
      specialtiesFromSignup.length > 0
        ? specialtiesFromSignup
        : [PRO_SERVICE_LABELS[primary] ?? primary],
    description:
      profile.bio?.trim() ||
      `${focusLine} Based in ${[profile.area, profile.city].filter(Boolean).join(", ") || "Lagos"}.`,
    phone: profile.phone || "+234 800 000 0000",
    serviceRadiusKm:
      profile.docsStatus === "under_review" || profile.docsStatus === "rejected"
        ? Math.min(profile.serviceRadiusKm ?? DEFAULT_RADIUS_KM, 2)
        : (profile.serviceRadiusKm ?? DEFAULT_RADIUS_KM),
    location: DEFAULT_USER_LOCATION.coordinates,
    markerLabel: "You",
    responseSpeedScore: 0.95,
    currentLoad: 0,
    servedVehicleType: profile.servedVehicleType,
    servedBrand: profile.servedBrand || profile.servedMake,
    servedMake: profile.servedBrand || profile.servedMake,
    servedModel: profile.servedModel,
    servedCountry: profile.servedCountry,
    servedLocation: profile.servedLocation ?? profile.area,
    businessName: profile.businessName,
    yearsExperience: profile.yearsExperience,
    bio: profile.bio,
    servicePrices: profile.servicePrices,
    pricingCurrency: profile.pricingCurrency,
    docsStatus: profile.docsStatus,
    docsRatingBoostApplied: profile.docsRatingBoostApplied,
    skillAnswers: profile.skillAnswers,
  };
}
