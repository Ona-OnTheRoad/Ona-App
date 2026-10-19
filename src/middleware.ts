import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const suppliedRequestId = req.headers.get("x-request-id")?.trim() || "";
  const requestId = /^[A-Za-z0-9._-]{1,64}$/.test(suppliedRequestId)
    ? suppliedRequestId
    : crypto.randomUUID();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", requestId);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  matcher: [
    /*
     * Skip static assets; run on pages and API only as needed.
     */
    "/((?!_next/static|_next/image|favicon.ico|brand/|media/|.*\\..*).*)",
  ],
};
