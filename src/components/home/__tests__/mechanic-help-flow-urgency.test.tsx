// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MechanicHelpFlow } from "@/components/home/mechanic-help-flow";

const nav = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => nav,
}));

vi.mock("@/lib/jobs/client", () => ({
  apiCreateJob: vi.fn(),
}));

vi.mock("@/components/map/address-autocomplete", () => ({
  AddressAutocomplete: () => null,
}));

vi.mock("@/components/jobs/voice-note-recorder", () => ({
  VoiceNoteRecorder: () => null,
}));

const app = vi.hoisted(() => ({
  location: {
    label: "Yaba, Lagos",
    coordinates: { lat: 6.5, lng: 3.38 },
  },
  userProfile: {
    identityId: "motorist-1",
    fullName: "Test Customer",
    avatarUrl: null,
    vehicles: [{ id: "v1", make: "Toyota", model: "Corolla", year: "2018" }],
  },
  backendUserId: "motorist-1",
  isAuthenticated: true,
  helpingSomeoneElse: false,
  helpingSomeoneLabel: null,
  updateUserProfile: vi.fn(),
  visibleTechnicians: [
    {
      id: "t1",
      serviceType: "towing",
      distanceKm: 2,
    },
  ],
}));

vi.mock("@/lib/store", () => ({
  useApp: () => app,
}));

beforeEach(() => {
  sessionStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(Date.parse("2026-08-18T12:00:00Z")); // 13:00 Lagos (day)
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("MechanicHelpFlow auto-highlights the best-fit urgency bar", () => {
  it("highlights Emergency after the diagnosis says the vehicle is not safe to drive", () => {
    render(<MechanicHelpFlow isLight={false} />);

    // 1. Vehicle step pick the saved vehicle.
    fireEvent.click(screen.getByText("Toyota Corolla"));

    // 2. Start screen branch C (strange noise).
    fireEvent.click(screen.getByText("Strange noise coming from the vehicle"));

    // 3. Noise questions.
    fireEvent.click(screen.getByText("Engine area (front)"));
    fireEvent.click(screen.getByText("Only when the engine is running (idle)"));
    fireEvent.click(screen.getByText("Rattling"));

    // 4. "Is the vehicle safe to drive?" → No.
    fireEvent.click(screen.getByText("No"));

    // 5. Route confirm (towing) → Yes.
    fireEvent.click(screen.getByText("Continue"));

    // 6. Urgency radios: Emergency must be the checked one.
    const emergency = screen.getByRole("radio", { name: /Emergency/ });
    const normal = screen.getByRole("radio", { name: /Normal/ });
    expect(emergency.getAttribute("aria-checked")).toBe("true");
    expect(normal.getAttribute("aria-checked")).toBe("false");
  });
});
