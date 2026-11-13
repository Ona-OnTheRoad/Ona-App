import { describe, expect, it, vi } from "vitest";
import { FakeSupabase, type Row } from "@/test-utils/fake-supabase";
import { findPhoneOwners, phoneTail } from "../phone-owners";

const PHONE = "+2348031234567";
const db = (profiles: Row[]) => new FakeSupabase({ profiles }) as unknown as Parameters<typeof findPhoneOwners>[0];
const filler = (n: number): Row[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `filler-${i}`,
    email: `f${i}@example.com`,
    // Different numbers, none ends in 8031234567.
    phone: `+23470${String(10000000 + i).slice(-8)}`,
  }));

describe("phoneTail", () => {
  it("is the last 10 digits whatever the formatting", () => {
    for (const raw of ["+2348031234567", "08031234567", "2348031234567", "0803 123 4567", "+234 (803) 123-4567"]) {
      expect(phoneTail(raw)).toBe("8031234567");
    }
  });
  it("is null when there are too few digits to judge", () => {
    expect(phoneTail("12345")).toBeNull();
    expect(phoneTail("")).toBeNull();
    expect(phoneTail(null)).toBeNull();
  });
});

describe("findPhoneOwners", () => {
  it("finds the owner even when they are far beyond the first 500 profiles", async () => {
    // The old check read 500 rows and compared in memory, so this was missed.
    const rows = [...filler(900), { id: "owner", email: "o@example.com", phone: PHONE }, ...filler(300)];
    const res = await findPhoneOwners(db(rows), PHONE);
    expect(res).toEqual({ owners: [{ id: "owner", email: "o@example.com", phone: PHONE }] });
  });

  it.each([
    "+2348031234567",
    "08031234567",
    "2348031234567",
    "0803 123 4567",
    "+234 803-123-4567",
    "(0803) 1234567",
    "234-803-123-4567",
  ])("matches an account stored as %s", async (stored) => {
    const res = await findPhoneOwners(db([...filler(600), { id: "u1", email: null, phone: stored }]), PHONE);
    expect(res).toMatchObject({ owners: [expect.objectContaining({ id: "u1" })] });
  });

  it("finds the number whichever way the new signup typed it", async () => {
    const rows = [{ id: "u1", email: null, phone: "+2348031234567" }];
    for (const typed of ["08031234567", "+2348031234567", "2348031234567", "0803 123 4567"]) {
      expect(await findPhoneOwners(db(rows), typed)).toMatchObject({ owners: [expect.objectContaining({ id: "u1" })] });
    }
  });

  it("does not report a different number, even one whose digits merely contain these in order", async () => {
    const rows = [
      { id: "other", email: null, phone: "+2348031234568" },
      // Contains 8-0-3-1-2-3-4-5-6-7 in order, but its last 10 digits differ.
      { id: "sneaky", email: null, phone: "180312345678" },
      { id: "nophone", email: null, phone: null },
    ];
    expect(await findPhoneOwners(db(rows), PHONE)).toEqual({ owners: [] });
  });

  it("returns every account that shares the number", async () => {
    const rows = [
      { id: "a", email: null, phone: "+2348031234567" },
      { id: "b", email: null, phone: "08031234567" },
    ];
    const res = await findPhoneOwners(db(rows), PHONE);
    expect("owners" in res && res.owners.map((o) => o.id).sort()).toEqual(["a", "b"]);
  });

  it("does not query at all for a number with too few digits", async () => {
    const sb = { from: vi.fn() } as unknown as Parameters<typeof findPhoneOwners>[0];
    expect(await findPhoneOwners(sb, "12345")).toEqual({ owners: [] });
    expect(sb.from).not.toHaveBeenCalled();
  });

  it("reports a database error instead of pretending the number is free", async () => {
    const failing = {
      from: () => ({
        select: () => ({ or: () => ({ limit: async () => ({ data: null, error: { message: "db down" } }) }) }),
      }),
    } as unknown as Parameters<typeof findPhoneOwners>[0];
    expect(await findPhoneOwners(failing, PHONE)).toEqual({ error: "db down" });
  });

  it("asks the database for the number across the whole table, not a window of rows", async () => {
    const or = vi.fn(() => ({ limit: async () => ({ data: [], error: null }) }));
    const select = vi.fn(() => ({ or }));
    const sb = { from: vi.fn(() => ({ select })) } as unknown as Parameters<typeof findPhoneOwners>[0];
    await findPhoneOwners(sb, PHONE);
    const filter = (or.mock.calls[0] as unknown as [string])[0];
    expect(filter).toContain("phone.eq.+2348031234567");
    expect(filter).toContain("phone.eq.08031234567");
    expect(filter).toContain("phone.ilike.%8%0%3%1%2%3%4%5%6%7%");
  });
});
