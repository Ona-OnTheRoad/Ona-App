// @vitest-environment jsdom
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ avatarUrl: "" as string | undefined }));
vi.mock("@/lib/store", () => ({
  useApp: () => ({ userProfile: { avatarUrl: state.avatarUrl } }),
}));

import { ProfileDockIcon } from "./profile-dock-icon";

describe("ProfileDockIcon", () => {
  it("shows the person's photo, ringed when the tab is active", () => {
    state.avatarUrl = "https://example.com/me.jpg";
    const { container, rerender } = render(
      <ProfileDockIcon className="rfd-icon" />,
    );
    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).toBe("https://example.com/me.jpg");
    expect(img?.className).toContain("rounded-full");
    rerender(<ProfileDockIcon className="rfd-icon rfd-icon--active" />);
    expect(container.querySelector("img")?.className).toContain("ring-2");
  });

  it("falls back to the profile glyph without a photo or when it fails to load", () => {
    state.avatarUrl = undefined;
    const none = render(<ProfileDockIcon className="rfd-icon" />);
    expect(none.container.querySelector("img")).toBeNull();
    expect(none.container.querySelector("svg")).not.toBeNull();
    none.unmount();

    state.avatarUrl = "https://example.com/broken.jpg";
    const broken = render(<ProfileDockIcon className="rfd-icon" />);
    fireEvent.error(broken.container.querySelector("img")!);
    expect(broken.container.querySelector("img")).toBeNull();
    expect(broken.container.querySelector("svg")).not.toBeNull();
  });
});
