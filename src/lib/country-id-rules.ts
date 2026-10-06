import { Country } from "country-state-city";
import { defaultPack } from "./country-id-rules/factories";
import { OVERRIDES_A } from "./country-id-rules/overrides-a";
import { OVERRIDES_B } from "./country-id-rules/overrides-b";
import type {
  CountryIdDoc,
  CountryIdPack,
  IdDocKind,
  IdFormatResult,
} from "./country-id-rules/types";

export type {
  CharsetMode,
  CountryIdDoc,
  CountryIdPack,
  IdDocKind,
  IdFormatResult,
} from "./country-id-rules/types";

/** Country-specific packs (only documents that apply there) */
const OVERRIDES: Record<string, () => CountryIdPack> = {
  ...OVERRIDES_A,
  ...OVERRIDES_B,
};

const packCache = new Map<string, CountryIdPack>();

/**
 * Product photo rules (all countries):
 * - Passport + national ID (NIN / Ghana Card / Aadhaar / etc.) → front only
 * - Driver’s licence + voter’s card → front and back
 * - Bank / tax IDs with no photo requirement stay unchanged
 */
export function applyPhotoSideRules(doc: CountryIdDoc): CountryIdDoc {
  if (doc.kind === "drivers_licence" || doc.kind === "voters_card") {
    return {
      ...doc,
      needsFront: true,
      needsBack: true,
      hint:
        doc.hint?.includes("front") || doc.hint?.includes("back")
          ? doc.hint
          : `${doc.hint || doc.label}. Front and back photos.`,
    };
  }
  if (doc.kind === "passport") {
    return {
      ...doc,
      needsFront: true,
      needsBack: false,
      hint: doc.hint || "Photo of the main page with your picture and number.",
    };
  }
  if (doc.kind === "national_id") {
    // Keep number-only national IDs (e.g. UK NI) with no photo slots
    if (!doc.needsFront && !doc.needsBack) return doc;
    return {
      ...doc,
      needsFront: true,
      needsBack: false,
      hint:
        (doc.hint || doc.label)
          .replace(/\s*[Ff]ront and back photos?\.?/g, "")
          .replace(/\s*[Pp]hotos of front and back\.?/g, "")
          .trim()
          .replace(/\.$/, "") + ". Front photo only.",
    };
  }
  return doc;
}

/** All ISO codes we know (from phone / world list) */
export function getAllCountryIsos(): string[] {
  try {
    return Country.getAllCountries().map((c) => c.isoCode);
  } catch {
    return Object.keys(OVERRIDES);
  }
}

/** ID rules for this phone-country ISO */
export function getCountryIdPack(iso: string): CountryIdPack {
  const code = (iso || "NG").toUpperCase();
  const hit = packCache.get(code);
  if (hit) return hit;
  const build = OVERRIDES[code];
  const raw = build ? build() : defaultPack(code);
  const pack: CountryIdPack = {
    ...raw,
    docs: raw.docs.map(applyPhotoSideRules),
  };
  packCache.set(code, pack);
  return pack;
}

export function getDoc(
  pack: CountryIdPack,
  kind: IdDocKind,
): CountryIdDoc | undefined {
  return pack.docs.find((d) => d.kind === kind);
}

export function requiredDocs(pack: CountryIdPack): CountryIdDoc[] {
  return pack.docs.filter((d) => d.requiredForVerify);
}

/** Filter raw input to allowed characters */
export function filterIdInput(raw: string, doc: CountryIdDoc): string {
  let v = raw;
  switch (doc.charset) {
    case "digits":
      v = v.replace(/\D/g, "");
      break;
    case "alnum":
      v = v.replace(/[^a-zA-Z0-9]/g, "");
      break;
    case "alnum_dash":
      v = v.replace(/[^a-zA-Z0-9\-]/g, "");
      break;
    default:
      break;
  }
  return v.slice(0, doc.maxLen);
}

export function validateIdFormat(
  value: string,
  doc: CountryIdDoc,
): IdFormatResult {
  const v = value.trim();
  if (!v) {
    return { ok: false, message: `Enter your ${doc.label}.` };
  }
  if (v.length < doc.minLen) {
    return {
      ok: false,
      message: `${doc.label} looks too short (need at least ${doc.minLen} characters).`,
    };
  }
  if (v.length > doc.maxLen) {
    return {
      ok: false,
      message: `${doc.label} looks too long (max ${doc.maxLen} characters).`,
    };
  }
  if (doc.pattern && !doc.pattern.test(v)) {
    return {
      ok: false,
      message: `${doc.label} format looks wrong. Check and try again.`,
    };
  }
  if (doc.charset === "digits" && /^(\d)\1+$/.test(v) && v.length >= 6) {
    return {
      ok: false,
      message: `Enter a real ${doc.label} (not the same digit repeated).`,
    };
  }
  return { ok: true };
}

export function needsPhotos(doc: CountryIdDoc): boolean {
  return doc.needsFront || doc.needsBack;
}
