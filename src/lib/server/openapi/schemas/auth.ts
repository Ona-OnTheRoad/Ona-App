import "server-only";
import { z } from "@/lib/server/openapi/zod-extend";

/** Shared with POST /api/auth/login */
export const authLoginBodySchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1),
  })
  .openapi("AuthLoginBody");

/** Shared with POST /api/auth/otp/send */
export const authOtpSendBodySchema = z
  .object({
    channel: z.enum(["phone", "email"]),
    target: z.string().min(3).max(120),
    opKey: z.string().min(1).max(100).optional().nullable(),
    opActorId: z.string().min(1).max(200).optional().nullable(),
  })
  .openapi("AuthOtpSendBody");

/** Shared with POST /api/auth/otp/verify */
export const authOtpVerifyBodySchema = z
  .object({
    channel: z.enum(["phone", "email"]),
    target: z.string().min(3).max(120),
    code: z.string().min(4).max(8),
    preferType: z.enum(["motorist", "professional"]).optional(),
  })
  .openapi("AuthOtpVerifyBody");

export const authUpdatePasswordBodySchema = z
  .object({
    currentPassword: z.string().min(1).optional(),
    newPassword: z.string().min(6),
  })
  .openapi("AuthUpdatePasswordBody");

export const authVerifyPasswordBodySchema = z
  .object({
    password: z.string().min(1),
  })
  .openapi("AuthVerifyPasswordBody");

export const authSwitchRoleBodySchema = z
  .object({
    role: z.enum(["motorist", "professional"]),
  })
  .openapi("AuthSwitchRoleBody");

export const authForgotPasswordBodySchema = z
  .object({
    email: z.string().email(),
  })
  .openapi("AuthForgotPasswordBody");

export const authPhoneSendOtpBodySchema = z
  .object({
    phone: z.string().min(7).max(32),
  })
  .openapi("AuthPhoneSendOtpBody");

export const authPhoneVerifyOtpBodySchema = z
  .object({
    phone: z.string().min(7).max(32),
    code: z.string().min(4).max(8),
  })
  .openapi("AuthPhoneVerifyOtpBody");

export const authProfileVerifyBodySchema = z
  .object({
    channel: z.enum(["phone", "email"]),
    target: z.string().min(3).max(120),
    code: z.string().min(4).max(8),
  })
  .openapi("AuthProfileVerifyBody");

/** Documented signup body (handler may accept additional optional fields). */
export const authSignupBodySchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(2).max(120),
    phone: z.string().min(7).max(32),
    accountType: z.enum(["motorist", "professional"]),
    gender: z.enum(["male", "female", "prefer_not_to_say"]),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    city: z.string().optional(),
    area: z.string().optional(),
    businessName: z.string().optional(),
    primaryService: z.string().optional(),
    services: z.array(z.string()).optional(),
  })
  .passthrough()
  .openapi("AuthSignupBody");
