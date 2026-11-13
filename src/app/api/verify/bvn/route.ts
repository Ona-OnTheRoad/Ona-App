import { NextResponse } from "next/server";
import { guardIdLookup, idLookupStatus } from "@/lib/server/identity/id-lookup-guard";
import { verifyBvnWithPrembly } from "@/lib/server/prembly";

export const runtime = "nodejs";

/**
 * POST /api/verify/bvn
 * Body: { bvn: string }
 * Verifies Nigeria BVN via Prembly when PREMBLY_API_KEY is set. Without a key
 * it runs a local 11-digit format check outside production and fails closed
 * (503) in production. Rate limited per IP; no sign-in, because signup calls
 * it before a session exists.
 */
export async function POST(req: Request) {
  try {
    const blocked = await guardIdLookup(req, "bvn");
    if (blocked) return blocked;

    const body = (await req.json().catch(() => ({}))) as { bvn?: string };
    const bvn = String(body.bvn ?? "").trim();
    if (!bvn) {
      return NextResponse.json(
        { ok: false, message: "BVN is required." },
        { status: 400 },
      );
    }
    const result = await verifyBvnWithPrembly(bvn);
    return NextResponse.json(result, { status: idLookupStatus(result) });
  } catch {
    return NextResponse.json(
      { ok: false, message: "BVN verification request failed." },
      { status: 500 },
    );
  }
}
