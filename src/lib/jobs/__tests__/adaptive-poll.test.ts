import { describe, expect, it } from "vitest";
import {
  computeAdaptiveJobPollDelayMs,
  getDegradedJobPollMs,
  getHealthyJobPollMs,
  getMaxJobPollBackoffMs,
} from "../adaptive-poll";

describe("adaptive-poll intervals and backoff", () => {
  it.each([
    [undefined, 2_000, 2_000, 16_000],
    ["waiting_for_selected", 1_000, 10_000, 8_000],
    ["selected_review", 1_000, 10_000, 8_000],
    ["sequential_pairing", 1_000, 10_000, 8_000],
    ["waiting_for_pro", 1_000, 10_000, 8_000],
    ["reserved", 1_000, 10_000, 8_000],
    ["negotiating", 8_000, 30_000, 30_000],
    ["searching", 8_000, 30_000, 30_000],
    ["agreed", 8_000, 30_000, 30_000],
    ["paid_booked", 15_000, 45_000, 60_000],
    ["en_route", 15_000, 45_000, 60_000],
    ["arrived", 15_000, 45_000, 60_000],
    ["in_progress", 15_000, 45_000, 60_000],
    ["completed", 15_000, 45_000, 60_000],
    ["released", 45_000, 120_000, 120_000],
    ["satisfied", 45_000, 120_000, 120_000],
    ["cancelled", 60_000, 180_000, 180_000],
    ["expired", 60_000, 180_000, 180_000],
  ] as const)(
    "maps %s to degraded=%dms, healthy=%dms, maxBackoff=%dms",
    (status, degraded, healthy, maxBackoff) => {
      expect(getDegradedJobPollMs(status)).toBe(degraded);
      expect(getHealthyJobPollMs(status)).toBe(healthy);
      expect(getMaxJobPollBackoffMs(status)).toBe(maxBackoff);
    },
  );

  it("uses healthy safety interval only when connected, online, and zero failures", () => {
    expect(
      computeAdaptiveJobPollDelayMs({
        status: "negotiating",
        subscriptionState: "connected",
        online: true,
        consecutiveFailures: 0,
      }),
    ).toBe(30_000);

    expect(
      computeAdaptiveJobPollDelayMs({
        status: "negotiating",
        subscriptionState: "connecting",
        online: true,
        consecutiveFailures: 0,
      }),
    ).toBe(8_000);

    expect(
      computeAdaptiveJobPollDelayMs({
        status: "negotiating",
        subscriptionState: "reconnecting",
        online: true,
        consecutiveFailures: 0,
      }),
    ).toBe(8_000);

    expect(
      computeAdaptiveJobPollDelayMs({
        status: "negotiating",
        subscriptionState: "failed",
        online: true,
        consecutiveFailures: 0,
      }),
    ).toBe(8_000);

    expect(
      computeAdaptiveJobPollDelayMs({
        status: "negotiating",
        subscriptionState: "connected",
        online: false,
        consecutiveFailures: 0,
      }),
    ).toBe(8_000);
  });

  it("applies bounded exponential backoff on consecutive failures and respects jitter bounds", () => {
    // Pairing base is 1s, max backoff is 8s
    expect(
      computeAdaptiveJobPollDelayMs({
        status: "reserved",
        subscriptionState: "reconnecting",
        consecutiveFailures: 1,
        jitterRatio: 0,
      }),
    ).toBe(2_000);

    expect(
      computeAdaptiveJobPollDelayMs({
        status: "reserved",
        subscriptionState: "reconnecting",
        consecutiveFailures: 2,
        jitterRatio: 0,
      }),
    ).toBe(4_000);

    expect(
      computeAdaptiveJobPollDelayMs({
        status: "reserved",
        subscriptionState: "reconnecting",
        consecutiveFailures: 5,
        jitterRatio: 0,
      }),
    ).toBe(8_000);

    // Jitter within [base, maxBackoff]
    const lowJitter = computeAdaptiveJobPollDelayMs({
      status: "reserved",
      subscriptionState: "reconnecting",
      consecutiveFailures: 2,
      jitterRatio: 0.15,
      random: () => 0,
    });
    const highJitter = computeAdaptiveJobPollDelayMs({
      status: "reserved",
      subscriptionState: "reconnecting",
      consecutiveFailures: 2,
      jitterRatio: 0.15,
      random: () => 1,
    });
    expect(lowJitter).toBe(3_400);
    expect(highJitter).toBe(4_600);
  });
});
