import "server-only";
/** Two-decimal provider major units → exact minor units, without rounding a mismatch away. */
export function exactProviderMinorUnits(amount: unknown): number {
  if ((typeof amount !== "number" && typeof amount !== "string") ||
      (typeof amount === "number" && !Number.isFinite(amount))) return Number.NaN;
  const match = String(amount).match(/^(\d+)(?:\.(\d{1,2})(0*))?$/);
  if (!match) return Number.NaN;
  const minor = BigInt(match[1]) * BigInt(100) + BigInt((match[2] || "").padEnd(2, "0"));
  const value = Number(minor);
  return Number.isSafeInteger(value) ? value : Number.NaN;
}
