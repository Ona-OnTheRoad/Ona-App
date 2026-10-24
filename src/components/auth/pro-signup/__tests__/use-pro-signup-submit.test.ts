// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/account-registry", () => ({
  checkIdentityAvailable: () => ({ ok: true }),
}));
vi.mock("@/lib/ng-id-verify-client", () => ({
  verifySignupIds: async () => ({ ok: true }),
}));
vi.mock("@/lib/signup-draft", () => ({ clearSignupDraft: vi.fn() }));
vi.mock("../build-pro-profile", () => ({
  buildProProfile: () => ({ bankCode: "044" }),
}));
vi.mock("../validation", () => ({ validateStep5: () => null }));

import {
  PASSWORD_MISMATCH_MESSAGE,
  useProSignupSubmit,
} from "../use-pro-signup-submit";

function setup(
  completeSignup: (
    p: unknown,
    o?: { onErrorCode?: (c: string) => void },
  ) => Promise<string | null>,
) {
  const flow = {
    busy: false,
    setBusy: vi.fn(),
    setFormError: vi.fn(),
    setStep: vi.fn(),
    setDone: vi.fn(),
  };
  const form = {
    dualSignup: true,
    idNumber: "",
    bvn: "",
    setPassword: vi.fn(),
    setConfirmPassword: vi.fn(),
  };
  const replace = vi.fn();
  const onPasswordRejected = vi.fn();
  const { result } = renderHook(() =>
    useProSignupSubmit({
      form,
      flow,
      skillSel: { skill: "mechanic", specialty: "engine", skillAnswers: {} },
      focus: {},
      fix: {},
      stepsOk: true,
      userProfile: null,
      refCode: null,
      completeSignup,
      replace,
      onPasswordRejected,
    } as never),
  );
  return { result, flow, form, replace, onPasswordRejected };
}

describe("useProSignupSubmit password_required", () => {
  it("returns to the password step instead of the error page", async () => {
    const { result, flow, form, replace, onPasswordRejected } = setup(
      async (_p, o) => {
        o?.onErrorCode?.("password_required");
        return "Enter the password for your existing Ona account";
      },
    );
    let res: { ok: boolean; error?: string } | undefined;
    await act(async () => {
      res = await result.current.finish();
    });
    expect(res).toEqual({ ok: false, error: PASSWORD_MISMATCH_MESSAGE });
    expect(replace).not.toHaveBeenCalled();
    expect(onPasswordRejected).toHaveBeenCalled();
    expect(form.setPassword).toHaveBeenCalledWith("");
    expect(flow.setFormError).toHaveBeenLastCalledWith(
      PASSWORD_MISMATCH_MESSAGE,
    );
  });

  it("keeps the error page for other failures", async () => {
    const { result, replace, onPasswordRejected } = setup(async (_p, o) => {
      o?.onErrorCode?.("phone_exists");
      return "Phone already used";
    });
    await act(async () => {
      await result.current.finish();
    });
    expect(replace).toHaveBeenCalledWith(
      expect.stringContaining("/signup/error"),
    );
    expect(onPasswordRejected).not.toHaveBeenCalled();
  });
});
