/**
 * Which side of the app a notification belongs to. A user can be both a customer
 * (motorist) and a Repair Pro on one account, so rows tied to a job carry the
 * recipient's role on that job. No audience = shown in both modes.
 */
export type NotificationAudience = "motorist" | "professional";

export function audienceForAccountType(
  accountType: string | null | undefined,
): NotificationAudience {
  return accountType === "professional" ? "professional" : "motorist";
}

export function matchesAudience(
  n: { audience?: NotificationAudience | null },
  role: NotificationAudience,
): boolean {
  return !n.audience || n.audience === role;
}

export function parseAudience(v: unknown): NotificationAudience | null {
  return v === "motorist" || v === "professional" ? v : null;
}
