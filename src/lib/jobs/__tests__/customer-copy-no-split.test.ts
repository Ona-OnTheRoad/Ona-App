import { describe, expect, it } from "vitest";
import {
  CONFIRM_RELEASE_NOTIFICATION_BODY,
  TRIP_STATUS_COPY,
} from "@/lib/jobs/constants";

/** Customers have no business with the payout split (87.5 / 5 / 7.5). */
const SPLIT = /87\.5|7\.5\s*%|VAT|\bOna\b|\bFLW\b|Flutterwave/i;

describe("customer-facing job copy hides the payout split", () => {
  it("release prompt notification", () => {
    expect(CONFIRM_RELEASE_NOTIFICATION_BODY).not.toMatch(SPLIT);
  });
  it("every customer trip status line", () => {
    for (const [status, copy] of Object.entries(TRIP_STATUS_COPY)) {
      expect(`${copy?.title} ${copy?.subtitle}`, status).not.toMatch(SPLIT);
    }
  });
});
