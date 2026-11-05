import "server-only";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { registerProductPath } from "@/lib/server/openapi/register-helpers";
import {
  jobCreateBodySchema,
  jobDisputeBodySchema,
  jobIdParamsSchema,
  jobLocationBodySchema,
  jobOfferBodySchema,
  jobPayBodySchema,
  jobRateBodySchema,
  jobTransitionBodySchema,
} from "@/lib/server/openapi/schemas/jobs";

const tag = ["jobs"];

export function registerJobsPaths(registry: OpenAPIRegistry) {
  registerProductPath({
    registry,
    method: "get",
    path: "/api/jobs",
    tags: tag,
    summary: "List jobs for the signed-in user",
    authenticated: true,
  });
  registerProductPath({
    registry,
    method: "post",
    path: "/api/jobs",
    tags: tag,
    summary: "Create a service request",
    body: jobCreateBodySchema,
    authenticated: true,
  });
  registerProductPath({
    registry,
    method: "get",
    path: "/api/jobs/{id}",
    tags: tag,
    summary: "Get job by id",
    params: jobIdParamsSchema,
    authenticated: true,
  });
  registerProductPath({
    registry,
    method: "post",
    path: "/api/jobs/{id}",
    tags: tag,
    summary: "Job detail action (legacy/compat POST)",
    params: jobIdParamsSchema,
    authenticated: true,
  });
  registerProductPath({
    registry,
    method: "post",
    path: "/api/jobs/{id}/transition",
    tags: tag,
    summary: "Apply a job state-machine transition",
    params: jobIdParamsSchema,
    body: jobTransitionBodySchema,
    authenticated: true,
  });
  registerProductPath({
    registry,
    method: "post",
    path: "/api/jobs/{id}/offer",
    tags: tag,
    summary: "Place or accept a labour offer",
    params: jobIdParamsSchema,
    body: jobOfferBodySchema,
    authenticated: true,
  });
  registerProductPath({
    registry,
    method: "post",
    path: "/api/jobs/{id}/pay",
    tags: tag,
    summary: "Start or cancel job escrow payment session",
    params: jobIdParamsSchema,
    body: jobPayBodySchema,
    authenticated: true,
  });
  registerProductPath({
    registry,
    method: "post",
    path: "/api/jobs/{id}/location",
    tags: tag,
    summary: "Update trip party location",
    params: jobIdParamsSchema,
    body: jobLocationBodySchema,
    authenticated: true,
  });
  registerProductPath({
    registry,
    method: "post",
    path: "/api/jobs/{id}/rate",
    tags: tag,
    summary: "Rate completed job",
    params: jobIdParamsSchema,
    body: jobRateBodySchema,
    authenticated: true,
  });
  registerProductPath({
    registry,
    method: "post",
    path: "/api/jobs/{id}/dispute",
    tags: tag,
    summary: "Open or resolve a job dispute",
    params: jobIdParamsSchema,
    body: jobDisputeBodySchema,
    authenticated: true,
  });
  registerProductPath({
    registry,
    method: "get",
    path: "/api/jobs/{id}/callout",
    tags: tag,
    summary: "Get call-out quote for job",
    params: jobIdParamsSchema,
    authenticated: true,
  });
  registerProductPath({
    registry,
    method: "get",
    path: "/api/jobs/pro-incoming-status",
    tags: tag,
    summary: "Repair pro incoming-request status",
    authenticated: true,
  });
}
