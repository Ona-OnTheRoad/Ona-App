// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { GeneratorHelpFlow } from "@/components/home/generator-help-flow";
import { SolarHelpFlow } from "@/components/home/solar-help-flow";
import { FashionHelpFlow } from "@/components/home/fashion-help-flow";
import { PlumberHelpFlow } from "@/components/home/plumber-help-flow";
import { CarpenterHelpFlow } from "@/components/home/carpenter-help-flow";
import { PainterHelpFlow } from "@/components/home/painter-help-flow";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));
vi.mock("@/lib/jobs/client", () => ({ apiCreateJob: vi.fn() }));
vi.mock("@/components/map/address-autocomplete", () => ({
  AddressAutocomplete: () => null,
}));
vi.mock("@/components/jobs/voice-note-recorder", () => ({
  VoiceNoteRecorder: () => null,
}));

const app = vi.hoisted(() => ({
  location: { label: "Yaba, Lagos", coordinates: { lat: 6.5, lng: 3.38 } },
  userProfile: { identityId: "m1", fullName: "Test", avatarUrl: null, vehicles: [] },
  backendUserId: "m1",
  isAuthenticated: true,
  helpingSomeoneElse: false,
  helpingSomeoneLabel: null,
  updateUserProfile: vi.fn(),
  visibleTechnicians: [],
}));
vi.mock("@/lib/store", () => ({ useApp: () => app }));

beforeEach(() => sessionStorage.clear());
afterEach(() => vi.clearAllMocks());

// Regression: both trades open on a type/brand/model step; it once rendered
// nothing (only a title), leaving testers on a blank screen.
describe("trades that open on the machine picker", () => {
  it("Generator shows the Type / Brand / Model fields and the no-generator option", () => {
    render(<GeneratorHelpFlow isLight={false} />);
    expect(screen.getByText("What type of Generator do you use?")).toBeTruthy();
    expect(screen.getByText("Type")).toBeTruthy();
    expect(screen.getByText("Brand")).toBeTruthy();
    expect(screen.getByText("Model")).toBeTruthy();
    expect(screen.getByText(/I don.t have one yet/)).toBeTruthy();
  });

  it("Solar shows the Type / Brand / Model fields", () => {
    render(<SolarHelpFlow isLight={false} />);
    expect(screen.getByText("What type of solar system do you use?")).toBeTruthy();
    expect(screen.getByText("Type")).toBeTruthy();
    expect(screen.getByText("Brand")).toBeTruthy();
    expect(screen.getByText("Model")).toBeTruthy();
  });
});

// Regression: trades without a vehicle step (Fashion, Plumber, Carpenter, Painter, Solar,
// Generator) open straight on a question and showed no Back arrow, so the user was stuck.
describe("Back on the first screen of every trade", () => {
  it.each([
    ["Fashion", FashionHelpFlow],
    ["Plumber", PlumberHelpFlow],
    ["Carpenter", CarpenterHelpFlow],
    ["Painter", PainterHelpFlow],
    ["Generator", GeneratorHelpFlow],
    ["Solar", SolarHelpFlow],
  ])("%s leaves the flow", (_name, Flow) => {
    const onExit = vi.fn();
    render(<Flow isLight={false} onExit={onExit} />);
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
