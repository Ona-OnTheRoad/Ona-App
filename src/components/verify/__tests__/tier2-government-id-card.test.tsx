// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Tier2GovernmentIdCard } from "../tier2-government-id-card";

describe("Tier2GovernmentIdCard", () => {
  it("is clickable and triggers onClick when phoneOk is true, submitted is false, and tier2Ok is false", () => {
    const handleClick = vi.fn();
    const { container } = render(
      <Tier2GovernmentIdCard
        phoneOk={true}
        submitted={false}
        tier2Ok={false}
        onClick={handleClick}
      />
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("cursor-pointer");

    fireEvent.click(card);
    expect(handleClick).toHaveBeenCalledTimes(1);

    // Chevron icon should be present when clickable
    expect(card.querySelector("svg.lucide-chevron-right")).toBeTruthy();
  });

  it("is NOT clickable when phoneOk is false (locked)", () => {
    const handleClick = vi.fn();
    const { container } = render(
      <Tier2GovernmentIdCard
        phoneOk={false}
        submitted={false}
        tier2Ok={false}
        onClick={handleClick}
      />
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("opacity-60 cursor-not-allowed");
    expect(screen.getByText("Locked")).toBeTruthy();

    fireEvent.click(card);
    expect(handleClick).not.toHaveBeenCalled();

    // Chevron should not be rendered
    expect(card.querySelector("svg.lucide-chevron-right")).toBeNull();
  });

  it("is NOT clickable when submitted is true (under review) to prevent navigation loop", () => {
    const handleClick = vi.fn();
    const { container } = render(
      <Tier2GovernmentIdCard
        phoneOk={true}
        submitted={true}
        tier2Ok={false}
        onClick={handleClick}
      />
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("cursor-default");
    expect(card.className).not.toContain("cursor-pointer");
    expect(card.className).not.toContain("opacity-60");
    expect(screen.getByText("Under review")).toBeTruthy();

    fireEvent.click(card);
    expect(handleClick).not.toHaveBeenCalled();

    // Chevron should not be rendered
    expect(card.querySelector("svg.lucide-chevron-right")).toBeNull();
  });

  it("is NOT clickable when tier2Ok is true (approved)", () => {
    const handleClick = vi.fn();
    const { container } = render(
      <Tier2GovernmentIdCard
        phoneOk={true}
        submitted={false}
        tier2Ok={true}
        onClick={handleClick}
      />
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("cursor-default");
    expect(card.className).not.toContain("cursor-pointer");
    expect(screen.getByText("Approved")).toBeTruthy();

    fireEvent.click(card);
    expect(handleClick).not.toHaveBeenCalled();

    // Chevron should not be rendered
    expect(card.querySelector("svg.lucide-chevron-right")).toBeNull();
  });
});
