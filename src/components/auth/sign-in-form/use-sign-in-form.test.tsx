// @vitest-environment jsdom
/** Email + password login: validation, role gate, success redirect, and method switching. */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSignInForm } from "./use-sign-in-form";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  signInWithPassword: vi.fn(),
  sendLoginOtp: vi.fn(),
  signInWithLoginOtp: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock("@/lib/i18n", () => ({ useT: () => (k: string) => k }));
vi.mock("@/lib/sound-tone", () => ({
  playAppSound: vi.fn(),
  unlockAudio: vi.fn(),
}));
vi.mock("@/lib/store", () => ({
  useApp: () => ({
    signInWithPassword: mocks.signInWithPassword,
    sendLoginOtp: mocks.sendLoginOtp,
    signInWithLoginOtp: mocks.signInWithLoginOtp,
  }),
}));

const submit = () =>
  ({ preventDefault: () => undefined }) as unknown as React.FormEvent;

describe("useSignInForm email login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it("defaults to email method first", () => {
    const { result } = renderHook(() => useSignInForm());
    expect(result.current.method).toBe("email");
  });

  it("allows switching to phone as the second option and back to email", () => {
    const { result } = renderHook(() => useSignInForm());
    expect(result.current.method).toBe("email");

    act(() => {
      result.current.pickMethod("phone");
    });
    expect(result.current.method).toBe("phone");

    act(() => {
      result.current.pickMethod("email");
    });
    expect(result.current.method).toBe("email");
  });

  it("asks for both fields before calling the server", async () => {
    const { result } = renderHook(() => useSignInForm());
    act(() => {
      result.current.pickRole("motorist");
      result.current.setEmail("a@b.co");
    });
    await act(async () => result.current.onSubmit(submit()));
    expect(result.current.displayError).toBe("Enter your email and password.");
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });

  it("logs in with the picked role and redirects customers home", async () => {
    mocks.signInWithPassword.mockResolvedValue(null);
    const { result } = renderHook(() => useSignInForm());
    act(() => {
      result.current.pickRole("motorist");
      result.current.setEmail(" a@b.co ");
      result.current.setPassword("secret");
    });
    await act(async () => result.current.onSubmit(submit()));
    expect(mocks.signInWithPassword).toHaveBeenCalledWith(
      "a@b.co",
      "secret",
      "motorist",
    );
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(mocks.replace).toHaveBeenCalledWith("/");
  });

  it("sends Repair Pros to the dashboard", async () => {
    mocks.signInWithPassword.mockResolvedValue(null);
    const { result } = renderHook(() => useSignInForm());
    act(() => {
      result.current.pickRole("professional");
      result.current.setEmail("a@b.co");
      result.current.setPassword("secret");
    });
    await act(async () => result.current.onSubmit(submit()));
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(mocks.replace).toHaveBeenCalledWith("/dashboard");
  });

  it("shows the server error and does not redirect", async () => {
    mocks.signInWithPassword.mockResolvedValue(
      "Email or password is incorrect.",
    );
    const { result } = renderHook(() => useSignInForm());
    act(() => {
      result.current.pickRole("motorist");
      result.current.setEmail("a@b.co");
      result.current.setPassword("nope");
    });
    await act(async () => result.current.onSubmit(submit()));
    expect(result.current.displayError).toBe("Email or password is incorrect.");
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("does not request an SMS code in email mode", async () => {
    const { result } = renderHook(() => useSignInForm());
    act(() => {
      result.current.pickRole("motorist");
    });
    await act(async () => result.current.onSubmit(submit()));
    expect(mocks.sendLoginOtp).not.toHaveBeenCalled();
  });
});
