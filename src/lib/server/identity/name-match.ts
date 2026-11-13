import "server-only";

/**
 * Compare the name an ID provider returns with a name we hold (profile name,
 * payout bank account name). Tolerant of case, spacing, punctuation, accents
 * and name order; strict about the surname.
 */
export type NameMatch = "match" | "mismatch" | "unknown";

export type HolderName = {
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

/** Lowercase tokens of two or more letters, accents and punctuation removed. */
export function nameTokens(raw: string | null | undefined): string[] {
  return String(raw ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z]+/g, " ")
    .split(" ")
    .filter((t) => t.length >= 2);
}

/**
 * `match` needs the holder's surname plus at least one other holder name in
 * `candidate`. When the provider gave no separate surname, two shared names
 * are required. `unknown` means there was not enough to compare.
 */
export function compareNames(
  holder: HolderName,
  candidate: string | null | undefined,
): NameMatch {
  const candidateSet = new Set(nameTokens(candidate));
  const surname = nameTokens(holder.lastName);
  const all = new Set([
    ...nameTokens(holder.fullName),
    ...nameTokens(holder.firstName),
    ...surname,
  ]);
  if (candidateSet.size < 2 || all.size < 2) return "unknown";

  const shared = [...all].filter((t) => candidateSet.has(t));
  if (surname.length === 0) return shared.length >= 2 ? "match" : "mismatch";

  const surnamePresent = surname.every((t) => candidateSet.has(t));
  const otherShared = shared.some((t) => !surname.includes(t));
  return surnamePresent && otherShared ? "match" : "mismatch";
}
