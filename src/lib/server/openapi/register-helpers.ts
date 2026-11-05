import "server-only";
import type { OpenAPIRegistry, RouteConfig } from "@asteasolutions/zod-to-openapi";
import type { ZodObject, ZodRawShape, ZodType } from "zod";
import { failResponses, jsonBody, okResponse } from "@/lib/server/openapi/envelopes";

const sessionSecurity = [{ sessionCookie: [] }];

type RegisterOpts = {
  registry: OpenAPIRegistry;
  method: RouteConfig["method"];
  path: string;
  tags: string[];
  summary: string;
  description?: string;
  body?: ZodType;
  params?: ZodObject<ZodRawShape>;
  query?: ZodObject<ZodRawShape>;
  /** Cookie/session auth required for try-it-out documentation. */
  authenticated?: boolean;
};

/** Register a product path with shared ok/fail envelopes. */
export function registerProductPath(opts: RegisterOpts) {
  const request: NonNullable<RouteConfig["request"]> = {};
  if (opts.body) {
    request.body = jsonBody(opts.body);
  }
  if (opts.params) {
    request.params = opts.params;
  }
  if (opts.query) {
    request.query = opts.query;
  }

  opts.registry.registerPath({
    method: opts.method,
    path: opts.path,
    tags: opts.tags,
    summary: opts.summary,
    description: opts.description,
    security: opts.authenticated ? sessionSecurity : undefined,
    request: Object.keys(request).length ? request : undefined,
    responses: {
      200: okResponse(),
      ...failResponses(),
    },
  });
}
