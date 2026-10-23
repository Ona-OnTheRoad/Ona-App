// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AppearanceThemeCard } from "../appearance-theme-card";

const mockSetTheme = vi.fn();
const mockTheme = "light";
const mockBackendUserId: string | null = "user-123";

vi.mock("@/lib/store", () => ({
  useApp: () => ({
    theme: mockTheme,
    setTheme: mockSetTheme,
    backendUserId: mockBackendUserId,
  }),
}));

vi.mock("@/lib/i18n", () => ({
  useI18n: () => ({
    locale: "en",
    t: (key: string) => {
      if (key === "settings.theme") return "Theme";
      if (key === "settings.systemDefault") return "System default";
      if (key === "settings.lightMode") return "Light mode";
      if (key === "settings.darkMode") return "Dark mode";
      return key;
    },
  }),
}));

describe("AppearanceThemeCard", () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
    localStorage.clear();
  });

  it("renders a single-choice radiogroup instead of toggle switches", () => {
    render(<AppearanceThemeCard isLight={true} />);

    // Must have radiogroup
    const radiogroup = screen.getByRole("radiogroup");
    expect(radiogroup).toBeTruthy();

    // Must NOT have toggle switches
    expect(screen.queryAllByRole("switch")).toHaveLength(0);

    // Must have 3 radio options: System default, Light mode, Dark mode
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);
  });

  it("selects Light mode and updates theme when clicked", () => {
    render(<AppearanceThemeCard isLight={true} />);

    const lightRadio = screen.getByText("Light mode").closest('[role="radio"]')!;
    fireEvent.click(lightRadio);

    expect(mockSetTheme).toHaveBeenCalledWith("light");
    expect(lightRadio.getAttribute("aria-checked")).toBe("true");

    const darkRadio = screen.getByText("Dark mode").closest('[role="radio"]')!;
    expect(darkRadio.getAttribute("aria-checked")).toBe("false");
  });

  it("selects Dark mode when clicked", () => {
    render(<AppearanceThemeCard isLight={true} />);

    const darkRadio = screen.getByText("Dark mode").closest('[role="radio"]')!;
    fireEvent.click(darkRadio);

    expect(mockSetTheme).toHaveBeenCalledWith("dark");
    expect(darkRadio.getAttribute("aria-checked")).toBe("true");
  });

  it("allows selection via keyboard Enter / Space", () => {
    render(<AppearanceThemeCard isLight={true} />);

    const darkRadio = screen.getByText("Dark mode").closest('[role="radio"]')!;
    fireEvent.keyDown(darkRadio, { key: "Enter" });

    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });
});
