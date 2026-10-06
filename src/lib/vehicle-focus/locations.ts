import { Country, State } from "country-state-city";

/** Cache all countries once (Nigeria first, then A-Z). */
let _countriesCache: string[] | null = null;
let _isoByName: Map<string, string> | null = null;

function ensureCountryIndex() {
  if (_countriesCache && _isoByName) return;
  const all = Country.getAllCountries();
  _isoByName = new Map(all.map((c) => [c.name, c.isoCode]));
  const nigeria = all.find((c) => c.isoCode === "NG");
  const rest = all
    .filter((c) => c.isoCode !== "NG")
    .map((c) => c.name)
    .sort((a, b) => a.localeCompare(b));
  _countriesCache = [
    "Any",
    ...(nigeria ? [nigeria.name] : ["Nigeria"]),
    ...rest,
    "Other",
  ];
}

/** All world countries Nigeria first, then alphabetical, plus Any/Other. */
export function getAllCountries(): string[] {
  ensureCountryIndex();
  return _countriesCache!;
}

/** @deprecated use getAllCountries() */
export const COUNTRIES =
  typeof window === "undefined"
    ? (["Any", "Nigeria", "Other"] as string[])
    : getAllCountries();

/**
 * States / regions for a country (full list from ISO data).
 * Nigeria → 36 states + FCT, etc.
 */
export function getLocationsForCountry(country: string): string[] {
  if (!country || country === "Any") {
    // Nigeria states as default browse list when country not set
    ensureCountryIndex();
    const ngIso = _isoByName?.get("Nigeria") ?? "NG";
    const ngStates = State.getStatesOfCountry(ngIso)
      .map((s) => s.name)
      .sort((a, b) => a.localeCompare(b));
    return ["Any", ...ngStates, "Other"];
  }
  if (country === "Other") {
    return ["Any", "Other"];
  }
  ensureCountryIndex();
  const iso = _isoByName?.get(country);
  if (!iso) return ["Any", "Other"];
  const states = State.getStatesOfCountry(iso)
    .map((s) => s.name)
    .sort((a, b) => a.localeCompare(b));
  if (states.length === 0) {
    // Some territories have no states offer Any/Other only
    return ["Any", "Other"];
  }
  return ["Any", ...states, "Other"];
}


export function syncLocationForCountry(
  country: string,
  currentLocation: string,
): string {
  const locs = getLocationsForCountry(country);
  if (locs.includes(currentLocation)) return currentLocation;
  return locs[0] ?? "Any";
}
