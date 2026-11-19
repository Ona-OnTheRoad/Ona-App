// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/store", () => ({
  useApp: () => ({ category: "none", setCategory: vi.fn() }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/i18n", () => ({ useT: () => (k: string) => k }));

import { CategoryTabs } from "../category-tabs";

const tiles = () => screen.getAllByRole("button").map((b) => b.textContent);

describe("CategoryTabs trade grid", () => {
  it("with the sheet down shows only the first row: Mechanic, Vulcanizer, Tow, Battery", () => {
    render(<CategoryTabs expanded={false} />);
    expect(tiles()).toEqual([
      "trade.mechanic",
      "trade.vulcanizer",
      "trade.towing",
      "trade.battery",
    ]);
  });

  it("with the sheet up shows every trade", () => {
    render(<CategoryTabs expanded />);
    expect(tiles().length).toBeGreaterThan(4);
  });
});
