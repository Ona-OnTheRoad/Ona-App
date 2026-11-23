// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Tier3LivenessCard } from "../tier3-liveness-card";

describe("Tier3LivenessCard", () => {
  it("shows Start and is clickable once Tier 2 is approved", () => {
    const onClick = vi.fn();
    const { container } = render(
      <Tier3LivenessCard isUnlocked isVerified={false} onClick={onClick} />,
    );
    expect(screen.getByText("Start")).toBeTruthy();
    expect(screen.queryByText("Locked")).toBeNull();
    fireEvent.click(container.firstChild as HTMLElement);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("shows Locked and ignores clicks before Tier 2", () => {
    const onClick = vi.fn();
    const { container } = render(
      <Tier3LivenessCard isUnlocked={false} onClick={onClick} />,
    );
    expect(screen.getByText("Locked")).toBeTruthy();
    fireEvent.click(container.firstChild as HTMLElement);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("shows Verified and does not reopen the check", () => {
    const onClick = vi.fn();
    const { container } = render(
      <Tier3LivenessCard isUnlocked isVerified onClick={onClick} />,
    );
    expect(screen.getByText("Verified")).toBeTruthy();
    expect(screen.queryByText("Locked")).toBeNull();
    fireEvent.click(container.firstChild as HTMLElement);
    expect(onClick).not.toHaveBeenCalled();
  });
});
