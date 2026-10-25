import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "../route";
import { NextRequest } from "next/server";

describe("GET /api/geocode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array for empty or short queries", async () => {
    const req = new NextRequest("http://localhost:3000/api/geocode?q=a");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results).toEqual([]);
  });

  it("returns curated places matching Lagos / Nigerian locations", async () => {
    const req = new NextRequest("http://localhost:3000/api/geocode?q=Lekki");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.results.length).toBeGreaterThan(0);
    expect(json.results[0].primary).toContain("Lekki");
  });

  it("serves repeated queries from cache with cached: true", async () => {
    const req1 = new NextRequest("http://localhost:3000/api/geocode?q=Ikeja");
    const res1 = await GET(req1);
    const json1 = await res1.json();
    expect(json1.results.length).toBeGreaterThan(0);

    const req2 = new NextRequest("http://localhost:3000/api/geocode?q=Ikeja");
    const res2 = await GET(req2);
    const json2 = await res2.json();
    expect(json2.cached).toBe(true);
    expect(json2.results).toEqual(json1.results);
  });
});

describe("GET /api/geocode caching", () => {
  it("does not share cache entries across different limits", async () => {
    const one = await (await GET(new NextRequest("http://localhost:3000/api/geocode?q=Yaba&limit=1"))).json();
    const many = await (await GET(new NextRequest("http://localhost:3000/api/geocode?q=Yaba&limit=5"))).json();
    expect(one.results.length).toBeLessThanOrEqual(1);
    expect(many.cached).toBe(false);
  });

  it("does not cache results when upstream fails", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("down"));
    const q = "zzzunknownplace";
    const first = await (await GET(new NextRequest(`http://localhost:3000/api/geocode?q=${q}`))).json();
    const second = await (await GET(new NextRequest(`http://localhost:3000/api/geocode?q=${q}`))).json();
    expect(first.cached).toBe(false);
    expect(second.cached).toBe(false);
    spy.mockRestore();
  });
});
