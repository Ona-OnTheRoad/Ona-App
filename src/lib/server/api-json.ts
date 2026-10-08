import "server-only";
import { NextResponse } from "next/server";

export function apiOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true as const, data }, init);
}

export function apiFail(
  message: string,
  status = 400,
  code = "error",
  extra?: Record<string, unknown>,
) {
  return NextResponse.json(
    { ok: false as const, error: { code, message, ...extra } },
    { status },
  );
}

export function apiFailFromError(error: unknown, fallback: string) {
  const value = error && typeof error === "object"
    ? error as { message?: unknown; status?: unknown; code?: unknown }
    : {};
  const requestedStatus = typeof value.status === "number" && value.status >= 400 && value.status <= 599
    ? value.status
    : 500;
  const status = requestedStatus;
  return apiFail(
    status < 500 && typeof value.message === "string" ? value.message : fallback,
    status,
    status < 500 && typeof value.code === "string" ? value.code : "error",
  );
}
