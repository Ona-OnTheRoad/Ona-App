import { isProService } from "@/lib/pro-service-id";
import type { ProService, UserProfile } from "@/lib/types";

/** First / primary signup skill only never multi-trade on My Profile */
export function primarySkill(
  profile: UserProfile | null | undefined,
  proServices: ProService[],
): ProService[] {
  const fromProfile = (profile?.services || []).filter(isProService);
  if (fromProfile[0]) return [fromProfile[0]];
  const fromState = (proServices || []).filter(isProService);
  if (fromState[0]) return [fromState[0]];
  return [];
}
