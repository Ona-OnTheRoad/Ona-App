/**
 * Sample notifications for local/demo when API table empty.
 * Motorist vs Repair Pro sets differ.
 */

import type { AppNotification } from "@/lib/notifications/types";
import { motoristSamples } from "./sample-local/motorist";
import { professionalSamples } from "./sample-local/professional";

/** 12+ samples spanning all categories */
export function localSampleNotifications(
  userId: string,
  role: "motorist" | "professional",
): AppNotification[] {
  if (role === "professional") {
    return professionalSamples(userId);
  }

  // Motorist samples
  return motoristSamples(userId);
}
