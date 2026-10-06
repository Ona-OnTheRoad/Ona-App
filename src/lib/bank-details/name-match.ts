/** Titles / noise ignored when matching signup vs bank account name */
const NAME_NOISE = new Set([
  "mr",
  "mrs",
  "ms",
  "miss",
  "dr",
  "prof",
  "sir",
  "eng",
  "chief",
  "alhaji",
  "alhaja",
  "barr",
  "hon",
  "jr",
  "sr",
  "ii",
  "iii",
]);

/** Split a person name into comparable tokens (min 2 letters). */
export function nameTokens(full: string | null | undefined): string[] {
  return String(full || "")
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, " ")
    .split(/[\s'-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !NAME_NOISE.has(t));
}

/**
 * Bank account name must share at least 2 name parts with signup full name
 * (or all parts if signup has fewer than 2 names).
 */
export function bankAccountMatchesSignupName(
  bankAccountName: string | null | undefined,
  signupFullName: string | null | undefined,
):
  | { ok: true; matches: number }
  | { ok: false; matches: number; error: string } {
  const signup = nameTokens(signupFullName);
  const bank = nameTokens(bankAccountName);
  if (!signup.length) {
    return {
      ok: false,
      matches: 0,
      error: "Your signup name is missing. Update your profile name first.",
    };
  }
  if (!bank.length) {
    return {
      ok: false,
      matches: 0,
      error: "Account name is required.",
    };
  }

  let matches = 0;
  const usedBank = new Set<number>();
  for (const s of signup) {
    const idx = bank.findIndex(
      (b, i) =>
        !usedBank.has(i) &&
        (b === s ||
          (s.length >= 3 && b.startsWith(s)) ||
          (b.length >= 3 && s.startsWith(b))),
    );
    if (idx >= 0) {
      matches += 1;
      usedBank.add(idx);
    }
  }

  const required = Math.min(2, signup.length);
  if (matches < required) {
    return {
      ok: false,
      matches,
      error:
        required >= 2
          ? "Bank name on file must match at least 2 parts of your Ona name."
          : "Bank name on file must match your Ona name.",
    };
  }
  return { ok: true, matches };
}
