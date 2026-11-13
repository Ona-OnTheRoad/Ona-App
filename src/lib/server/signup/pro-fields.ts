import "server-only";
import { isProService } from "@/lib/services";
import { capCertDataUrl, slimSkillAnswers } from "@/lib/server/signup/helpers";
import type { SignupInput } from "@/lib/server/signup/schema";
import type { ProService } from "@/lib/types";

/** Repair Pro values worked out from the signup body before the row is written. */
export async function deriveProFields(input: SignupInput) {
  const svc = (
    input.primaryService && isProService(input.primaryService)
      ? input.primaryService
      : "mechanic"
  ) as ProService;
  const servicesList = (
    input.services?.length
      ? input.services.filter((s): s is ProService => isProService(s))
      : [svc]
  ) as ProService[];
  const labourPrices: Record<string, number> = {};
  if (input.labourPrices) {
    for (const [k, v] of Object.entries(input.labourPrices)) {
      const n =
        typeof v === "number" ? v : Number(String(v).replace(/[^\d.]/g, ""));
      if (Number.isFinite(n) && n > 0) labourPrices[k] = n;
    }
  }
  const saRaw =
    (input.skillAnswers as Record<string, unknown> | undefined) || {};
  const specialtyFromSignup = (() => {
    if (typeof saRaw.specialty === "string" && saRaw.specialty.trim()) {
      return saRaw.specialty.trim();
    }
    if (Array.isArray(saRaw.specialties) && saRaw.specialties.length) {
      return String(saRaw.specialties[0] || "").trim() || null;
    }
    return null;
  })();
  const specialtiesArr = (() => {
    const out: string[] = [];
    if (Array.isArray(saRaw.specialties)) {
      for (const x of saRaw.specialties) {
        const s = String(x || "").trim();
        if (s && !out.includes(s)) out.push(s);
      }
    }
    if (specialtyFromSignup && !out.includes(specialtyFromSignup)) {
      out.unshift(specialtyFromSignup);
    }
    return out;
  })();
  // Vehicle brand focus vs home specialty focus (shared catalog helper)
  const { storesVehicleBrandFocus } = await import("@/lib/artisan/catalog");
  const isVehicleTrade = storesVehicleBrandFocus(
    svc,
    specialtyFromSignup,
    specialtiesArr,
  );
  const vehicleFocus = isVehicleTrade
    ? {
        ...(input.vehicleFocus || {}),
        servedVehicleType: input.servedVehicleType || null,
        servedBrand: input.servedBrand || null,
        servedModel: input.servedModel || null,
        servedCountry: input.servedCountry || null,
        servedLocation: input.servedLocation || null,
      }
    : {
        trade: svc,
        // Critical for customer Home/Office/Industrial filters
        specialty: specialtyFromSignup,
        specialties: specialtiesArr,
        servedCountry: input.servedCountry || null,
        servedLocation: input.servedLocation || null,
      };
  // Cert upload at signup → under_review (2 km discovery until admin approves)
  const certFromSkills = (() => {
    const sa = input.skillAnswers as Record<string, unknown> | undefined;
    const file = sa?.certificationUpload as
      { name?: string; dataUrl?: string } | undefined;
    if (file && typeof file === "object" && file.name) {
      return {
        name: String(file.name),
        dataUrl: typeof file.dataUrl === "string" ? file.dataUrl : undefined,
      };
    }
    return null;
  })();
  const certName =
    input.certificationFileName || certFromSkills?.name || null;
  const rawCertUrl =
    input.certificationFileDataUrl || certFromSkills?.dataUrl || null;
  const certUrl = capCertDataUrl(rawCertUrl);
  const hasCert = Boolean(certName || certUrl || rawCertUrl);
  // Default: under_review only when cert present; bare signup is "none" (full radius)
  const docsStatus = input.docsStatus || (hasCert ? "under_review" : "none");
  const skillsSlim = {
    ...slimSkillAnswers(
      input.skillAnswers as Record<string, unknown> | undefined,
    ),
    // Always mirror signup focus so marketplace specialty filters work
    ...(specialtyFromSignup ? { specialty: specialtyFromSignup } : {}),
    ...(specialtiesArr.length ? { specialties: specialtiesArr } : {}),
  };

  return {
    svc,
    servicesList,
    labourPrices,
    vehicleFocus,
    certName,
    certUrl,
    hasCert,
    docsStatus,
    skillsSlim,
  };
}
