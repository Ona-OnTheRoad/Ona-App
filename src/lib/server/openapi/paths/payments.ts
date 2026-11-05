import "server-only";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { registerProductPath } from "@/lib/server/openapi/register-helpers";
import {
  paymentsCheckBankUniqueBodySchema,
  paymentsInitBodySchema,
  paymentsRefundBodySchema,
  paymentsReleaseBodySchema,
  paymentsResolveAccountBodySchema,
  paymentsVerifyBodySchema,
} from "@/lib/server/openapi/schemas/payments";

const tag = ["payments"];

export function registerPaymentsPaths(registry: OpenAPIRegistry) {
  registerProductPath({
    registry,
    method: "post",
    path: "/api/payments/init",
    tags: tag,
    summary: "Initialize job escrow charge",
    body: paymentsInitBodySchema,
    authenticated: true,
  });
  registerProductPath({
    registry,
    method: "post",
    path: "/api/payments/verify",
    tags: tag,
    summary: "Verify gateway charge and book job",
    body: paymentsVerifyBodySchema,
    authenticated: true,
  });
  registerProductPath({
    registry,
    method: "post",
    path: "/api/payments/release",
    tags: tag,
    summary: "Dual completion / release escrow payout",
    body: paymentsReleaseBodySchema,
    authenticated: true,
  });
  registerProductPath({
    registry,
    method: "post",
    path: "/api/payments/refund",
    tags: tag,
    summary: "Refund held escrow before job start",
    body: paymentsRefundBodySchema,
    authenticated: true,
  });
  registerProductPath({
    registry,
    method: "get",
    path: "/api/payments/banks",
    tags: tag,
    summary: "List Nigerian banks for payout/NUBAN",
    authenticated: true,
  });
  registerProductPath({
    registry,
    method: "post",
    path: "/api/payments/resolve-account",
    tags: tag,
    summary: "Resolve NUBAN account holder name",
    body: paymentsResolveAccountBodySchema,
    authenticated: true,
  });
  registerProductPath({
    registry,
    method: "get",
    path: "/api/payments/history",
    tags: tag,
    summary: "Payment history for signed-in user",
    authenticated: true,
  });
  registerProductPath({
    registry,
    method: "post",
    path: "/api/payments/check-bank-unique",
    tags: tag,
    summary: "Check bank account uniqueness",
    body: paymentsCheckBankUniqueBodySchema,
  });
}
