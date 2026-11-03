import "server-only";
import type { ZodType } from "zod";
import { z } from "@/lib/server/openapi/zod-extend";

export const ApiOkEnvelope = z
  .object({
    ok: z.literal(true),
    data: z.unknown(),
  })
  .openapi("ApiOkEnvelope");

export const ApiFailEnvelope = z
  .object({
    ok: z.literal(false),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
      })
      .passthrough(),
  })
  .openapi("ApiFailEnvelope");

export function jsonBody(schema: ZodType) {
  return {
    content: {
      "application/json": {
        schema,
      },
    },
  };
}

export function okResponse(description = "Success") {
  return {
    description,
    content: {
      "application/json": {
        schema: ApiOkEnvelope,
      },
    },
  };
}

export function failResponses() {
  return {
    400: {
      description: "Validation or client error",
      content: { "application/json": { schema: ApiFailEnvelope } },
    },
    401: {
      description: "Unauthenticated",
      content: { "application/json": { schema: ApiFailEnvelope } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: ApiFailEnvelope } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ApiFailEnvelope } },
    },
    429: {
      description: "Rate limited",
      content: { "application/json": { schema: ApiFailEnvelope } },
    },
    500: {
      description: "Server error",
      content: { "application/json": { schema: ApiFailEnvelope } },
    },
    503: {
      description: "Dependency unavailable",
      content: { "application/json": { schema: ApiFailEnvelope } },
    },
  };
}
