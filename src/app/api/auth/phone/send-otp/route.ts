/**
 * Legacy phone OTP send forwards to unified /api/auth/otp/send
 */
import { apiFail, apiOk } from "@/lib/server/api-json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Forward the real client IP: the target route rate-limits per IP. */
function forwardedHeaders(req: Request): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const xff = req.headers.get("x-forwarded-for");
  const real = req.headers.get("x-real-ip");
  if (xff) headers["x-forwarded-for"] = xff;
  if (real) headers["x-real-ip"] = real;
  return headers;
}

export async function POST(req: Request) {
  let body: { phone?: string };
  try {
    body = await req.json();
  } catch {
    return apiFail("Invalid JSON", 400);
  }
  const origin = new URL(req.url).origin;
  const res = await fetch(`${origin}/api/auth/otp/send`, {
    method: "POST",
    headers: forwardedHeaders(req),
    body: JSON.stringify({ channel: "phone", target: body.phone || "" }),
  });
  const json = await res.json().catch(() => null);
  if (!json?.ok) {
    return apiFail(
      json?.error?.message || "Could not send code",
      res.status || 400,
      json?.error?.code || "error",
    );
  }
  return apiOk(json.data);
}
