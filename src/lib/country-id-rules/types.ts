/**
 * Motorist identity documents by phone-country (ISO 3166-1 alpha-2).
 * Only shows docs that apply to that country. Driver’s licence is one option
 * whose length / charset / photo rules change per country.
 */

export type IdDocKind =
  | "national_id"
  | "drivers_licence"
  | "passport"
  | "bank_id"
  | "tax_id"
  | "voters_card"
  | "residence_permit";

export type CharsetMode = "digits" | "alnum" | "alnum_dash" | "any";

export type CountryIdDoc = {
  kind: IdDocKind;
  /** Short plain label for the user */
  label: string;
  /** Needed to finish identity verification for this country */
  requiredForVerify: boolean;
  minLen: number;
  maxLen: number;
  charset: CharsetMode;
  /** Optional regex after charset filter */
  pattern?: RegExp;
  needsFront: boolean;
  needsBack: boolean;
  /** Server check when available */
  api?: "nin" | "bvn" | null;
  placeholder: string;
  /** One-line plain hint */
  hint: string;
};

export type CountryIdPack = {
  iso: string;
  countryName: string;
  docs: CountryIdDoc[];
  /** Simple “how it works” lines (plain English) */
  howItWorks: string[];
};

export type IdFormatResult = { ok: true } | { ok: false; message: string };
