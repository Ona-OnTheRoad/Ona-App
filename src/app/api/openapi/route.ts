import { NextResponse } from "next/server";
import {
  buildOpenApiDocument,
  isOpenApiDocsEnabled,
  OPENAPI_ROUTE_INVENTORY,
} from "@/lib/server/openapi";
import { apiFail } from "@/lib/server/api-json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/openapi — OpenAPI 3.1 JSON when docs are enabled. */
export async function GET() {
  if (!isOpenApiDocsEnabled()) {
    return apiFail("OpenAPI docs are disabled", 404, "docs_disabled");
  }

  const document = {
    ...(buildOpenApiDocument() as unknown as Record<string, unknown>),
    "x-ona-inventory": OPENAPI_ROUTE_INVENTORY,
  };
  return NextResponse.json(document, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
