import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { beforeEach, describe, expect, it } from "vitest";

/** Minimal in-memory Cache Storage, enough for public/sw.js. */
class FakeCache {
  store = new Map<string, Response>();
  private key(r: Request | string) {
    return typeof r === "string" ? new URL(r, "https://ona.test").href : r.url;
  }
  async match(r: Request | string) {
    const hit = this.store.get(this.key(r));
    return hit ? hit.clone() : undefined;
  }
  async put(r: Request | string, res: Response) {
    this.store.set(this.key(r), res);
  }
  async add(url: string) {
    this.store.set(this.key(url), new Response("<h1>offline</h1>", { headers: { "content-type": "text/html" } }));
  }
  async keys() {
    return [...this.store.keys()].map((u) => new Request(u));
  }
  async delete(r: Request | string) {
    return this.store.delete(this.key(r));
  }
}

class FakeCaches {
  caches = new Map<string, FakeCache>();
  async open(name: string) {
    if (!this.caches.has(name)) this.caches.set(name, new FakeCache());
    return this.caches.get(name)!;
  }
  async keys() {
    return [...this.caches.keys()];
  }
  async delete(name: string) {
    return this.caches.delete(name);
  }
  async match(r: Request | string) {
    for (const c of this.caches.values()) {
      const hit = await c.match(r);
      if (hit) return hit;
    }
    return undefined;
  }
}

const code = readFileSync(join(process.cwd(), "public/sw.js"), "utf8");
/** A same-origin fetch returns a "basic" response; a constructed Response is "default", so mark it. */
function basic(res: Response): Response {
  Object.defineProperty(res, "type", { value: "basic" });
  return res;
}
const html = (body = "page") =>
  basic(new Response(`<html>${body}</html>`, { status: 200, headers: { "content-type": "text/html" } }));

function load(fetchImpl: (r: Request) => Promise<Response>) {
  const caches = new FakeCaches();
  const listeners: Record<string, (e: unknown) => void> = {};
  const fetchCalls: string[] = [];
  const self = {
    location: { origin: "https://ona.test" },
    addEventListener: (type: string, fn: (e: unknown) => void) => (listeners[type] = fn),
    skipWaiting: async () => undefined,
    clients: { claim: async () => undefined },
  };
  runInNewContext(code, {
    self,
    caches,
    fetch: async (r: Request) => {
      fetchCalls.push(r.url);
      return fetchImpl(r);
    },
    Response,
    Request,
    URL,
    Promise,
    setTimeout,
    clearTimeout,
  });
  const request = async (path: string, init: { method?: string; mode?: string; headers?: Record<string, string> } = {}) => {
    const url = path.startsWith("http") ? path : `https://ona.test${path}`;
    const req = new Request(url, { method: init.method ?? "GET", headers: init.headers });
    Object.defineProperty(req, "mode", { value: init.mode ?? "no-cors" });
    let responded: Promise<Response> | undefined;
    const waits: Promise<unknown>[] = [];
    listeners.fetch({
      request: req,
      respondWith: (p: Promise<Response>) => (responded = p),
      waitUntil: (p: Promise<unknown>) => waits.push(p),
    });
    const res = responded ? await responded : undefined;
    await Promise.allSettled(waits);
    return res;
  };
  return { caches, listeners, fetchCalls, request };
}

describe("service worker routing", () => {
  let sw: ReturnType<typeof load>;
  beforeEach(() => {
    sw = load(async () => html());
  });

  it("never handles non-GET, API, admin, cross-origin or Range requests", async () => {
    expect(await sw.request("/api/jobs", { mode: "cors" })).toBeUndefined();
    expect(await sw.request("/admin/payments", { mode: "navigate" })).toBeUndefined();
    expect(await sw.request("/jobs/abc", { method: "POST", mode: "cors" })).toBeUndefined();
    expect(await sw.request("https://api.supabase.co/rest/v1/x", { mode: "cors" })).toBeUndefined();
    expect(await sw.request("/brand/video.mp4", { headers: { range: "bytes=0-10" } })).toBeUndefined();
    expect(sw.fetchCalls).toEqual([]);
  });

  it("serves hashed build files from cache after the first fetch", async () => {
    await sw.request("/_next/static/chunks/a.js");
    await sw.request("/_next/static/chunks/a.js");
    expect(sw.fetchCalls.length).toBe(1);
  });

  it("stores a page it fetched and shows it when the network is down", async () => {
    await sw.request("/jobs", { mode: "navigate" });
    const down = load(async () => {
      throw new Error("offline");
    });
    // Reuse the populated cache for the offline run.
    (down.caches as FakeCaches).caches = sw.caches.caches;
    const res = await down.request("/jobs", { mode: "navigate" });
    expect(await res!.text()).toContain("page");
  });

  it("falls back to the offline page when offline with nothing cached", async () => {
    const down = load(async () => {
      throw new Error("offline");
    });
    await (down.listeners.install as (e: unknown) => void)({ waitUntil: () => undefined });
    await down.caches.open("ona-pages-2026-10-05-1").then((c) => c.add("/offline.html"));
    const res = await down.request("/wallet", { mode: "navigate" });
    expect(await res!.text()).toContain("offline");
  });

  it("does not store pages with a query string or on sensitive paths", async () => {
    await sw.request("/?code=secret", { mode: "navigate" });
    await sw.request("/payments/callback", { mode: "navigate" });
    await sw.request("/login/reset-password", { mode: "navigate" });
    const pages = await sw.caches.open("ona-pages-2026-10-05-1");
    const stored = [...(pages as FakeCache).store.keys()].filter((u) => !u.endsWith("/offline.html"));
    expect(stored).toEqual([]);
  });

  it("removes caches from older versions when it activates", async () => {
    await sw.caches.open("ona-static-old");
    await sw.caches.open("unrelated-cache");
    await (sw.listeners.activate as (e: unknown) => void)({ waitUntil: (p: Promise<unknown>) => p });
    await new Promise((r) => setTimeout(r, 0));
    const names = await sw.caches.keys();
    expect(names).not.toContain("ona-static-old");
    expect(names).toContain("unrelated-cache");
  });
});
