import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Short-lived, signed, user-bound proofs ("this user just passed check X").
 *
 * Each kind of proof gets its own `domain`, which is mixed into the signature, so
 * a token minted for one purpose can never be replayed as another (an identity
 * proof is not a bank-change proof, and neither is a signup phone proof).
 */
export function createUserProof(domain: string, ttlMs: number) {
  type Payload = { u: string; exp: number; n: string };

  function secret(): string {
    const s =
      process.env.OTP_PROOF_SECRET?.trim() ||
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!s) throw new Error("OTP proof secret is not configured");
    return s;
  }
  const sign = (body: string) =>
    createHmac("sha256", secret()).update(`${domain}.${body}`).digest("base64url");

  return {
    ttlMs,
    /** Throws only if no signing secret is configured. */
    issue(userId: string, now: number = Date.now()): { proof: string; expiresAt: number } {
      const expiresAt = now + ttlMs;
      const payload: Payload = { u: userId, exp: expiresAt, n: randomBytes(8).toString("hex") };
      const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
      return { proof: `${body}.${sign(body)}`, expiresAt };
    },
    /** True only for an untampered, unexpired proof of this kind issued for exactly this user. Never throws. */
    verify(token: string | null | undefined, userId: string, now: number = Date.now()): boolean {
      try {
        if (!token || typeof token !== "string" || !userId) return false;
        const parts = token.split(".");
        if (parts.length !== 2) return false;
        const [body, sig] = parts;
        const a = Buffer.from(sig);
        const b = Buffer.from(sign(body));
        if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
        const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Partial<Payload>;
        if (typeof payload.exp !== "number" || payload.exp <= now) return false;
        return payload.u === userId;
      } catch {
        return false;
      }
    },
  };
}
