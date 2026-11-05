import "server-only";
import { z } from "@/lib/server/openapi/zod-extend";

export const paymentsInitBodySchema = z
  .object({
    requestId: z.string().min(1),
    motoristId: z.string().min(1),
    repairProId: z.string().min(1),
    serviceType: z.string().min(1),
    email: z.string().email(),
    baseAmountMajor: z.number().positive(),
    discountPercent: z.number().min(0).max(50).optional().default(0),
    currency: z
      .enum(["NGN", "USD", "GBP", "ZAR", "EUR", "GHS", "KES", "CAD", "AUD"])
      .optional(),
    countryCode: z.string().optional(),
    countryName: z.string().optional(),
    provider: z.enum(["paystack", "flutterwave", "mock"]).optional(),
  })
  .openapi("PaymentsInitBody");

export const paymentsVerifyBodySchema = z
  .object({
    reference: z.string().min(3).optional(),
    transactionId: z.union([z.string(), z.number()]).optional(),
    jobId: z.string().optional(),
    provider: z.enum(["paystack", "flutterwave", "mock"]).optional(),
  })
  .openapi("PaymentsVerifyBody");

export const paymentsReleaseBodySchema = z
  .object({
    requestId: z.string().min(1),
    role: z.enum(["motorist", "professional"]),
    userId: z.string().min(1),
  })
  .openapi("PaymentsReleaseBody");

export const paymentsRefundBodySchema = z
  .object({
    requestId: z.string().min(1),
    reason: z.string().optional(),
    userId: z.string().min(1),
  })
  .openapi("PaymentsRefundBody");

export const paymentsResolveAccountBodySchema = z
  .object({
    accountNumber: z.string().min(10).max(12),
    bankCode: z.string().min(1).max(20),
  })
  .openapi("PaymentsResolveAccountBody");

export const paymentsCheckBankUniqueBodySchema = z
  .object({
    accountNumber: z.string().min(10).max(12),
    bankCode: z.string().min(1).max(20),
    access_token: z.string().optional(),
  })
  .openapi("PaymentsCheckBankUniqueBody");
