// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PasswordInput } from "../password-input";
import { PasswordInputField } from "@/components/security/password-2fa/password-input-field";

afterEach(() => cleanup());

function Harness(props: Partial<React.ComponentProps<typeof PasswordInput>>) {
  const [v, setV] = useState("");
  return <PasswordInput value={v} onChange={setV} placeholder="Enter your password" {...props} />;
}

describe("PasswordInput", () => {
  it("the show/hide toggle is reachable by keyboard (not removed from the tab order)", () => {
    render(<Harness />);
    const toggle = screen.getByRole("button", { name: "Show password" });
    expect(toggle.getAttribute("tabindex")).toBeNull();
  });

  it("announces its state with aria-pressed and keeps one stable name", () => {
    render(<Harness />);
    const input = screen.getByPlaceholderText("Enter your password") as HTMLInputElement;
    const toggle = screen.getByRole("button", { name: "Show password" });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(input.type).toBe("password");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(input.type).toBe("text");
    // The name does not flip to "Hide password" (a pressed toggle must not rename itself).
    expect(screen.getByRole("button", { name: "Show password" })).toBe(toggle);
    fireEvent.click(toggle);
    expect(input.type).toBe("password");
  });

  it("can be given an accessible name, id and description instead of relying on the placeholder", () => {
    render(<Harness id="pw" ariaLabel="Current password" ariaDescribedBy="pw-help" ariaInvalid />);
    const input = screen.getByLabelText("Current password");
    expect(input.getAttribute("id")).toBe("pw");
    expect(input.getAttribute("aria-describedby")).toBe("pw-help");
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  it("still works as before with only the original props", () => {
    render(<Harness />);
    const input = screen.getByPlaceholderText("Enter your password") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "hunter2" } });
    expect(input.value).toBe("hunter2");
    expect(input.getAttribute("aria-label")).toBeNull();
  });
});

describe("PasswordInputField (security screens)", () => {
  it("has a real label, a keyboard-reachable toggle and aria-pressed", () => {
    render(<PasswordInputField id="current-password" label="Password" value="" onChange={() => {}} placeholder="Enter your password" />);
    expect(screen.getByLabelText("Password")).toBeTruthy();
    const toggle = screen.getByRole("button", { name: "Show password" });
    expect(toggle.getAttribute("tabindex")).toBeNull();
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect((screen.getByLabelText("Password") as HTMLInputElement).type).toBe("text");
  });
});
