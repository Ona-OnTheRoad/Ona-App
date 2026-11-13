import { NextResponse } from "next/server";
import { guardIdLookup, idLookupStatus } from "@/lib/server/identity/id-lookup-guard";
import { verifyNinWithPrembly } from "@/lib/server/prembly";

export const runtime = "nodejs";

/**
 * POST /api/verify/nin
 * Body: { nin: string }
 * Verifies Nigeria NIN via Prembly when PREMBLY_API_KEY is set. Without a key
 * it runs a local 11-digit format check outside production and fails closed
 * (503) in production. Rate limited per IP; no sign-in, because signup calls
 * it before a session exists.
 */
export async function POST(req: Request) {
  try {
    const blocked = await guardIdLookup(req, "nin");
    if (blocked) return blocked;

    const body = (await req.json().catch(() => ({}))) as { nin?: string };
    const nin = String(body.nin ?? "").trim();
    if (!nin) {
      return NextResponse.json(
        { ok: false, message: "NIN is required." },
        { status: 400 },
      );
    }
    const result = await verifyNinWithPrembly(nin);
    return NextResponse.json(result, { status: idLookupStatus(result) });
  } catch {
    return NextResponse.json(
      { ok: false, message: "NIN verification request failed." },
      { status: 500 },
    );
  }
}
