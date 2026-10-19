/** First/Last name inputs map losslessly onto the stored `fullName`. */
export function composeFullName(first: string, last: string): string {
  return `${first.trim()} ${last.trim()}`.trim();
}

/** First word → first name, the rest → last name (used for locked dual-signup prefill). */
export function splitFullName(full: string): { first: string; last: string } {
  const t = full.trim().replace(/\s+/g, " ");
  const i = t.indexOf(" ");
  return i < 0
    ? { first: t, last: "" }
    : { first: t.slice(0, i), last: t.slice(i + 1) };
}
