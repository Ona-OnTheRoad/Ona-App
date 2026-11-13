// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OtpCodeStep } from "../shared/otp-code-step";

afterEach(() => cleanup());

const setup = (over: Partial<React.ComponentProps<typeof OtpCodeStep>> = {}) => {
  const onChange = vi.fn();
  const onVerify = vi.fn();
  render(
    <OtpCodeStep isLight prompt="Enter the 6-digit code sent to your phone." value="" onChange={onChange} busy={false} onVerify={onVerify} {...over} />,
  );
  return { onChange, onVerify };
};

describe("OtpCodeStep", () => {
  it("is named, described by its prompt, and set up for SMS autofill (WebOTP / iOS suggestion)", () => {
    setup();
    const input = screen.getByLabelText("6-digit security code") as HTMLInputElement;
    expect(input.getAttribute("autocomplete")).toBe("one-time-code");
    expect(input.getAttribute("inputmode")).toBe("numeric");
    expect(input.getAttribute("pattern")).toBe("[0-9]*");
    expect(input.maxLength).toBe(6);
    const describedBy = input.getAttribute("aria-describedby")!;
    expect(document.getElementById(describedBy)?.textContent).toBe("Enter the 6-digit code sent to your phone.");
  });

  it("keeps the placeholder the existing flows and tests rely on", () => {
    setup();
    expect(screen.getByPlaceholderText("000000")).toBeTruthy();
  });

  it("still strips non-digits and caps at 6", () => {
    const { onChange } = setup();
    fireEvent.change(screen.getByPlaceholderText("000000"), { target: { value: "12a3-45 678" } });
    expect(onChange).toHaveBeenCalledWith("123456");
  });

  it("Verify is disabled until 4 digits, while busy, and calls onVerify otherwise", () => {
    const first = setup({ value: "123" });
    expect((screen.getByRole("button", { name: "Verify code" }) as HTMLButtonElement).disabled).toBe(true);
    cleanup();
    setup({ value: "123456", busy: true });
    expect((screen.getByRole("button", { name: "Verifying…" }) as HTMLButtonElement).disabled).toBe(true);
    cleanup();
    const ok = setup({ value: "123456" });
    fireEvent.click(screen.getByRole("button", { name: "Verify code" }));
    expect(ok.onVerify).toHaveBeenCalledTimes(1);
    expect(first.onVerify).not.toHaveBeenCalled();
  });

  it("two code steps on one page get distinct description ids", () => {
    render(
      <>
        <OtpCodeStep isLight prompt="A" value="" onChange={() => {}} busy={false} onVerify={() => {}} />
        <OtpCodeStep isLight prompt="B" value="" onChange={() => {}} busy={false} onVerify={() => {}} />
      </>,
    );
    const ids = screen.getAllByLabelText("6-digit security code").map((e) => e.getAttribute("aria-describedby"));
    expect(new Set(ids).size).toBe(2);
  });
});
