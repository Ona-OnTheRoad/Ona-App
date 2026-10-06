// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ServiceActionResult } from "@/lib/store";
import type { ServiceRequest } from "@/lib/types";

const updateRequestStatus = vi.fn<
  (id: string, status: string) => Promise<ServiceActionResult>
>();

const job = {
  id: "job1",
  problem: "Flat tyre",
  serviceType: "vulcanizer",
  status: "accepted",
  technicianId: "pro1",
  technicianName: "Ada",
  locationLabel: "Lekki",
  distanceKm: 2,
  etaMinutes: 8,
  createdAt: "2026-10-01T10:00:00.000Z",
} as unknown as ServiceRequest;

vi.mock("@/lib/store", () => ({
  useApp: () => ({
    requests: [job],
    updateRequestStatus,
    theme: "light",
    userMode: "professional",
    accountType: "professional",
    proServices: ["vulcanizer"],
    displayName: "Ada",
    backendUserId: "pro1",
  }),
}));
vi.mock("@/components/layout/page-header", () => ({
  PageHeader: () => null,
}));
vi.mock("@/components/call/in-app-call", () => ({
  CallButton: () => null,
}));

import ProOrdersPage from "@/app/(artisan)/orders/page";

describe("Orders desk", () => {
  it("shows the server's message when a transition is rejected", async () => {
    updateRequestStatus.mockResolvedValue({
      ok: false,
      code: "transition_failed",
      message: "You are too far from the customer",
      actionCount: 0,
    });
    render(<ProOrdersPage />);
    fireEvent.click(screen.getByText("I'm en route"));
    await waitFor(() =>
      expect(
        screen.getByText("You are too far from the customer"),
      ).toBeTruthy(),
    );
    expect(updateRequestStatus).toHaveBeenCalledWith("job1", "en_route");
  });

  it("clears the error after an accepted transition", async () => {
    updateRequestStatus
      .mockResolvedValueOnce({
        ok: false,
        code: "transition_failed",
        message: "Network down",
        actionCount: 0,
      })
      .mockResolvedValueOnce({ ok: true, warning: null, actionCount: 0 });
    render(<ProOrdersPage />);
    fireEvent.click(screen.getByText("I'm en route"));
    await waitFor(() => expect(screen.getByText("Network down")).toBeTruthy());
    fireEvent.click(screen.getByText("I'm en route"));
    await waitFor(() => expect(screen.queryByText("Network down")).toBeNull());
  });
});
