// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sonner = vi.hoisted(() => {
  const toast = Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() });
  return { toast };
});
vi.mock("sonner", () => sonner);

import { toastError, toastInfo, toastSuccess } from "@/lib/toast";
import { useFeedbackToast } from "@/lib/use-feedback-toast";

describe("toast helpers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("de-duplicates by message through the toast id", () => {
    toastError("Nope");
    expect(sonner.toast.error).toHaveBeenCalledWith("Nope", {
      id: "error:Nope",
      duration: 6000,
    });
    toastSuccess("Saved");
    expect(sonner.toast.success).toHaveBeenCalledWith("Saved", {
      id: "success:Saved",
      duration: 4000,
    });
    toastInfo("FYI");
    expect(sonner.toast).toHaveBeenCalledWith("FYI", {
      id: "info:FYI",
      duration: 4000,
    });
  });
});

describe("useFeedbackToast", () => {
  beforeEach(() => vi.clearAllMocks());

  it("toasts an error and an info string when they appear", () => {
    const { rerender } = renderHook(
      ({ info, error }) => useFeedbackToast(info, error),
      { initialProps: { info: "", error: "" } },
    );
    expect(sonner.toast.error).not.toHaveBeenCalled();
    rerender({ info: "", error: "Bad code" });
    expect(sonner.toast.error).toHaveBeenCalledTimes(1);
    rerender({ info: "Code sent", error: "Bad code" });
    expect(sonner.toast.success).toHaveBeenCalledTimes(1);
  });

  it("re-arms the same message after it is cleared", () => {
    const { rerender } = renderHook(
      ({ error }) => useFeedbackToast("", error),
      { initialProps: { error: "Bad code" } },
    );
    rerender({ error: "" });
    rerender({ error: "Bad code" });
    expect(sonner.toast.error).toHaveBeenCalledTimes(2);
  });
});
