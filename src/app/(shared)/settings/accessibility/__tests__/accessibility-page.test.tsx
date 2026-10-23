// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SettingsAccessibilityPage from "../page";

const mockBack = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}));

vi.mock("@/lib/store", () => ({
  useApp: () => ({
    theme: "light",
    accountType: "motorist",
  }),
}));

const mockNavigateBack = vi.fn();
vi.mock("@/lib/navigation", () => ({
  navigateBack: (...args: unknown[]) => mockNavigateBack(...args),
}));

describe("SettingsAccessibilityPage", () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockPush.mockClear();
    mockNavigateBack.mockClear();
    localStorage.clear();
  });

  it("renders header 'Accessibility' and subtitle 'Text size and readability'", () => {
    render(<SettingsAccessibilityPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Accessibility" })).toBeTruthy();
    expect(screen.getByText("Text size and readability")).toBeTruthy();
    expect(screen.queryByText("Pricing & Services")).toBeNull();
  });

  it("routes back to /settings/appearance when clicking the back button", () => {
    render(<SettingsAccessibilityPage />);

    const backBtn = screen.getByRole("button", { name: "Back" });
    fireEvent.click(backBtn);

    expect(mockNavigateBack).toHaveBeenCalledWith(
      expect.anything(),
      "/settings/appearance",
      "motorist",
    );
  });

  it("allows decreasing, increasing, and resetting text size", () => {
    render(<SettingsAccessibilityPage />);

    expect(screen.getByText("Current 100%")).toBeTruthy();

    const increaseBtn = screen.getByRole("button", { name: "A+ Increase" });
    fireEvent.click(increaseBtn);
    expect(screen.getByText("Current 110%")).toBeTruthy();

    const decreaseBtn = screen.getByRole("button", { name: "A- Decrease" });
    fireEvent.click(decreaseBtn);
    expect(screen.getByText("Current 100%")).toBeTruthy();

    fireEvent.click(increaseBtn);
    fireEvent.click(increaseBtn);
    expect(screen.getByText("Current 120%")).toBeTruthy();

    const resetBtn = screen.getByRole("button", { name: "Reset to default" });
    fireEvent.click(resetBtn);
    expect(screen.getByText("Current 100%")).toBeTruthy();
  });

  it("toggles stronger contrast", () => {
    render(<SettingsAccessibilityPage />);

    const toggle = screen.getByRole("switch", { name: "Stronger contrast" });
    expect(toggle.getAttribute("aria-checked")).toBe("false");

    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-checked")).toBe("true");

    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-checked")).toBe("false");
  });
});
