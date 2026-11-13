import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as verifyBvn } from "@/app/api/verify/bvn/route";
import { POST as verifyNin } from "@/app/api/verify/nin/route";
import { verifyBvnWithPrembly, verifyNinWithPrembly } from "@/lib/server/prembly";

vi.mock("@/lib/server/prembly", async (original) => ({
  ...(await original<typeof import("@/lib/server/prembly")>()),
  verifyNinWithPrembly: vi.fn(),
  verifyBvnWithPrembly: vi.fn(),
}));

const NUMBER = "12345678901";
const routes = [
  { kind: "nin", post: verifyNin, lookup: verifyNinWithPrembly },
  { kind: "bvn", post: verifyBvn, lookup: verifyBvnWithPrembly },
] as const;

function request(kind: "nin" | "bvn") {
  return new Request(`https://ona.test/api/verify/${kind}`, {
    method: "POST",
    headers: { "x-forwarded-for": "203.0.113.7" },
    body: JSON.stringify({ [kind]: NUMBER }),
  });
}

/** Deployed limiter: every count comes from the (stubbed) Redis REST call. */
function redis(reply: () => Response | Promise<Response>) {
  const fetchMock = vi.fn(async () => reply());
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.test");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe.each(routes)("POST /api/verify/$kind", ({ kind, post, lookup }) => {
  it("returns 429 with Retry-After and skips the provider when the budget is spent", async () => {
    redis(() => Response.json({ result: [21, 120_000] }));

    const res = await post(request(kind));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("120");
    expect(body).toMatchObject({ ok: false, code: "rate_limited" });
    expect(body.message).toMatch(/Too many/);
    expect(lookup).not.toHaveBeenCalled();
  });

  it("returns 503 and skips the provider when the limiter is down", async () => {
    redis(() => { throw new Error("outage"); });

    const res = await post(request(kind));
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body).toMatchObject({ ok: false, code: "rate_limit_unavailable" });
    expect(typeof body.message).toBe("string");
    expect(lookup).not.toHaveBeenCalled();
  });

  it("keys the budget on the caller IP and the lookup kind", async () => {
    const fetchMock = redis(() => Response.json({ result: [1, 600_000] }));
    vi.mocked(lookup).mockResolvedValue({ ok: true, provider: "prembly", mode: "live" });

    await post(request(kind));
    const other = request(kind);
    other.headers.set("x-forwarded-for", "203.0.113.8");
    await post(other);

    const keys = fetchMock.mock.calls.map(
      (call) => JSON.parse(String((call as unknown as [string, RequestInit])[1].body))[3],
    );
    expect(keys[0]).not.toBe(keys[1]);
    expect(keys[0]).not.toContain("203.0.113.7");
  });

  it("passes a verified result through with 200", async () => {
    redis(() => Response.json({ result: [1, 600_000] }));
    vi.mocked(lookup).mockResolvedValue({
      ok: true, provider: "prembly", mode: "live", reference: "ref-1",
    });

    const res = await post(request(kind));

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, reference: "ref-1" });
    expect(lookup).toHaveBeenCalledWith(NUMBER);
  });

  it("returns 503 when the lookup is not configured and 422 when it is rejected", async () => {
    redis(() => Response.json({ result: [1, 600_000] }));
    vi.mocked(lookup).mockResolvedValueOnce({
      ok: false, provider: "local", mode: "sandbox_format",
      message: "not available", code: "NOT_CONFIGURED",
    });
    expect((await post(request(kind))).status).toBe(503);

    vi.mocked(lookup).mockResolvedValueOnce({
      ok: false, provider: "prembly", mode: "live", message: "no match", code: "01",
    });
    expect((await post(request(kind))).status).toBe(422);
  });
});
