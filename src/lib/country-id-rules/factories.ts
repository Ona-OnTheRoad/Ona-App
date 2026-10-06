import { Country } from "country-state-city";
import type { CharsetMode, CountryIdDoc, CountryIdPack } from "./types";

export function nameForIso(iso: string): string {
  try {
    return Country.getCountryByCode(iso)?.name || iso;
  } catch {
    return iso;
  }
}

/** Shared driver’s licence factory rules vary by country */
export function driversLicence(opts: {
  minLen: number;
  maxLen: number;
  charset: CharsetMode;
  pattern?: RegExp;
  needsBack?: boolean;
  placeholder?: string;
  hint?: string;
  requiredForVerify?: boolean;
}): CountryIdDoc {
  return {
    kind: "drivers_licence",
    label: "Driver’s licence",
    requiredForVerify: opts.requiredForVerify ?? false,
    minLen: opts.minLen,
    maxLen: opts.maxLen,
    charset: opts.charset,
    pattern: opts.pattern,
    needsFront: true,
    needsBack: opts.needsBack ?? true,
    api: null,
    placeholder: opts.placeholder || "Licence number",
    hint:
      opts.hint ||
      "Use the licence for the same country as your phone number. Photo of front and back.",
  };
}

export function passportDoc(required = false): CountryIdDoc {
  return {
    kind: "passport",
    label: "International passport",
    requiredForVerify: required,
    minLen: 6,
    maxLen: 12,
    charset: "alnum",
    needsFront: true,
    needsBack: false,
    api: null,
    placeholder: "Passport number",
    hint: "Photo of the main page with your picture and number.",
  };
}

/** Default pack for any country without a special rule set */
export function defaultPack(iso: string): CountryIdPack {
  const countryName = nameForIso(iso);
  return {
    iso,
    countryName,
    docs: [
      {
        kind: "national_id",
        label: "National ID",
        requiredForVerify: true,
        minLen: 5,
        maxLen: 20,
        charset: "alnum_dash",
        needsFront: true,
        needsBack: true,
        api: null,
        placeholder: "ID number",
        hint: `Government ID issued in ${countryName}. Photos of front and back.`,
      },
      driversLicence({
        minLen: 5,
        maxLen: 20,
        charset: "alnum_dash",
        needsBack: true,
      }),
      passportDoc(false),
    ],
    howItWorks: [
      "We use the country on your phone number.",
      "Pick an ID that is valid in that country only.",
      "Type the number carefully, then add clear photos.",
      "If your country uses a bank ID, we may ask for that too.",
      "When checks pass, you can book without limits.",
    ],
  };
}
