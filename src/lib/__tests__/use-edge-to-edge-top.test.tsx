// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { EdgeToEdgeTop } from "@/components/layout/edge-to-edge-top";

beforeEach(() => {
  document.body.innerHTML = '<div id="ona-phone"></div>';
});
afterEach(() => {
  document.body.innerHTML = "";
});

const phone = () => document.getElementById("ona-phone")!;

describe("useEdgeToEdgeTop", () => {
  it("marks the shell while mounted and clears it on unmount", () => {
    const { unmount } = render(<EdgeToEdgeTop />);
    expect(phone().hasAttribute("data-edge-top")).toBe(true);
    unmount();
    expect(phone().hasAttribute("data-edge-top")).toBe(false);
  });

  it("stays marked until the last screen that wants it unmounts", () => {
    const a = render(<EdgeToEdgeTop />);
    const b = render(<EdgeToEdgeTop />);
    a.unmount();
    expect(phone().hasAttribute("data-edge-top")).toBe(true);
    b.unmount();
    expect(phone().hasAttribute("data-edge-top")).toBe(false);
  });
});
