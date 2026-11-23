// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const left = vi.hoisted(() => ({ sec: 66 }));
vi.mock("@/lib/jobs/use-exact-countdown", () => ({
  useExactCountdown: () => ({ displayMs: left.sec * 1000 }),
}));
vi.mock("@/lib/jobs/countdown-math", () => ({ secondsLeftFloor: () => left.sec }));
vi.mock("@/lib/jobs/server-clock", () => ({ serverNow: () => 0 }));

import { CountdownTimer } from "../countdown-timer";

const pairing = { endsAt: "2026-11-23T20:00:00.000Z", totalMs: 66_000 };

describe("CountdownTimer (pairing window)", () => {
  it("shows 66 seconds as 1m 06s", () => {
    left.sec = 66;
    render(<CountdownTimer {...pairing} variant="ring" />);
    expect(screen.getByText("1m 06s")).toBeTruthy();
  });

  it("stays in seconds under a minute", () => {
    left.sec = 45;
    render(<CountdownTimer {...pairing} />);
    expect(screen.getByText("45s")).toBeTruthy();
  });

  it("keeps the clock format for long windows", () => {
    left.sec = 19 * 60 + 5;
    render(<CountdownTimer endsAt={pairing.endsAt} totalMs={20 * 60_000} />);
    expect(screen.getByText("19:05")).toBeTruthy();
  });
});
