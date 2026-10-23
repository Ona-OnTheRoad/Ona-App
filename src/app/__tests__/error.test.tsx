// @vitest-environment jsdom
import { StrictMode } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import AppError from "../error";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
const router = { replace };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

afterEach(() => {
  cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); replace.mockReset();
  localStorage.clear();
});

it("redirects once after five seconds without updating Router during render", () => {
  vi.useFakeTimers();
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  render(<StrictMode><AppError error={new Error("database unavailable")} reset={vi.fn()} /></StrictMode>);
  act(() => { vi.advanceTimersByTime(4000); });
  expect(replace).not.toHaveBeenCalled();
  expect(screen.getByText("Go home (1s)")).toBeTruthy();
  act(() => { vi.advanceTimersByTime(1000); });
  expect(replace).toHaveBeenCalledExactlyOnceWith("/");
  act(() => { vi.advanceTimersByTime(5000); });
  expect(replace).toHaveBeenCalledTimes(1);
  expect(consoleError.mock.calls.flat().join(" ")).not.toMatch(/Cannot update a component/);
});

it("cancels the pending redirect when the error screen unmounts", () => {
  vi.useFakeTimers();
  const view = render(<AppError error={new Error("database unavailable")} reset={vi.fn()} />);
  view.unmount();
  act(() => { vi.advanceTimersByTime(6000); });
  expect(replace).not.toHaveBeenCalled();
});
