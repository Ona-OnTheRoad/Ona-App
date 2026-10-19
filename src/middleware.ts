import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * On backend hostnames, send non-admin traffic to the control centre.
 * Prevents the consumer phone shell from loading at backend root.
 */
function isBackendHost(host: string): boolean {
  const h = host.toLowerCase().split(":")[0];
  // localhost is always the consumer app; the admin is simply /admin on it.
  return (
    h.includes("336699-backend") ||
    h.startsWith("336699-backend") ||
    h.includes("ona-backend") ||
    h.startsWith("ona-backend") ||
    h.includes("ogamecho-backend") ||
    h.startsWith("ogamecho-backend") ||
    h === "ona-backend-mi.vercel.app" ||
    h === "ona-backend-two.vercel.app" ||
    h === "ona-backend-wit7.vercel.app" ||
    h === "ona-backend.vercel.app" ||
    h === "ogamecho-backend-mi.vercel.app" ||
    h === "ogamecho-backend-two.vercel.app" ||
    h === "ogamecho-backend-wit7.vercel.app"
  );
}

export function middleware(req: NextRequest) {
  const suppliedRequestId = req.headers.get("x-request-id")?.trim() || "";
  const requestId = /^[A-Za-z0-9._-]{1,64}$/.test(suppliedRequestId)
    ? suppliedRequestId
    : crypto.randomUUID();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", requestId);

  const host = req.headers.get("host") || "";
  if (!isBackendHost(host)) {
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set("x-request-id", requestId);
    return response;
  }

  const { pathname } = req.nextUrl;
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set("x-request-id", requestId);
    return response;
  }

  const url = req.nextUrl.clone();
  url.pathname = "/admin";
  const response = NextResponse.redirect(url);
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
