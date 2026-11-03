import "server-only";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { registerProductPath } from "@/lib/server/openapi/register-helpers";
import {
  authForgotPasswordBodySchema,
  authLoginBodySchema,
  authOtpSendBodySchema,
  authOtpVerifyBodySchema,
  authPhoneSendOtpBodySchema,
  authPhoneVerifyOtpBodySchema,
  authProfileVerifyBodySchema,
  authSignupBodySchema,
  authSwitchRoleBodySchema,
  authUpdatePasswordBodySchema,
  authVerifyPasswordBodySchema,
} from "@/lib/server/openapi/schemas/auth";

const tag = ["auth"];

export function registerAuthPaths(registry: OpenAPIRegistry) {
  registerProductPath({
    registry,
    method: "post",
    path: "/api/auth/login",
    tags: tag,
    summary: "Email/password login",
    body: authLoginBodySchema,
  });
  registerProductPath({
    registry,
    method: "post",
    path: "/api/auth/signup",
    tags: tag,
    summary: "Create motorist or professional account",
    body: authSignupBodySchema,
  });
  registerProductPath({
    registry,
    method: "post",
    path: "/api/auth/logout",
    tags: tag,
    summary: "End session",
    authenticated: true,
  });
  registerProductPath({
    registry,
    method: "post",
    path: "/api/auth/otp/send",
    tags: tag,
    summary: "Send login OTP to phone or email",
    body: authOtpSendBodySchema,
  });
  registerProductPath({
    registry,
    method: "post",
    path: "/api/auth/otp/verify",
    tags: tag,
    summary: "Verify login OTP and open session",
    body: authOtpVerifyBodySchema,
  });
  registerProductPath({
    registry,
    method: "post",
    path: "/api/auth/otp/profile-verify",
    tags: tag,
    summary: "Verify OTP for profile contact change",
    body: authProfileVerifyBodySchema,
    authenticated: true,
  });
  registerProductPath({
    registry,
    method: "post",
    path: "/api/auth/phone/send-otp",
    tags: tag,
    summary: "Send phone OTP",
    body: authPhoneSendOtpBodySchema,
  });
  registerProductPath({
    registry,
    method: "post",
    path: "/api/auth/phone/verify-otp",
    tags: tag,
    summary: "Verify phone OTP",
    body: authPhoneVerifyOtpBodySchema,
  });
  registerProductPath({
    registry,
    method: "post",
    path: "/api/auth/forgot-password",
    tags: tag,
    summary: "Request password reset email",
    body: authForgotPasswordBodySchema,
  });
  registerProductPath({
    registry,
    method: "post",
    path: "/api/auth/update-password",
    tags: tag,
    summary: "Update password",
    body: authUpdatePasswordBodySchema,
    authenticated: true,
  });
  registerProductPath({
    registry,
    method: "post",
    path: "/api/auth/verify-password",
    tags: tag,
    summary: "Confirm current password",
    body: authVerifyPasswordBodySchema,
    authenticated: true,
  });
  registerProductPath({
    registry,
    method: "post",
    path: "/api/auth/switch-role",
    tags: tag,
    summary: "Switch active motorist/professional role",
    body: authSwitchRoleBodySchema,
    authenticated: true,
  });
}
