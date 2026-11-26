/** User-facing name for the pro role (customers stay "Customer"). */
export const PRO_ROLE_LABEL = "Service Pro";

/**
 * Placeholder pro names stored on jobs and conversations before a real name is
 * known. "Repair Pro" is the legacy value still present in saved rows.
 */
const PRO_PLACEHOLDER_NAMES = new Set(["Repair Pro", "Service Pro"]);

export function isProPlaceholderName(name: string | null | undefined): boolean {
  return PRO_PLACEHOLDER_NAMES.has((name ?? "").trim());
}
