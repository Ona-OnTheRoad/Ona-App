import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabase: vi.fn(),
}));

import { createServiceSupabase } from "@/lib/supabase/server";
import {
  listCourierProviders,
  patchCourierProvider,
  upsertCourierProvider,
} from "@/lib/server/shop/admin-couriers";

const createServiceSupabaseMock = vi.mocked(createServiceSupabase);

function makeSb(opts: {
  list?: { data: unknown[] | null; error?: { message: string } | null };
  updateDefaultSpy?: ReturnType<typeof vi.fn>;
  upsertResult?: { data: unknown | null; error?: { message: string } | null };
}) {
  const list = opts.list ?? { data: [], error: null };
  const upsertResult = opts.upsertResult ?? { data: { id: "p1" }, error: null };
  const demoteDefault = opts.updateDefaultSpy ?? vi.fn(async () => ({ error: null }));

  const sb = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          order: vi.fn(async () => list),
        })),
        eq: vi.fn(() => ({ single: vi.fn(async () => upsertResult) })),
      })),
      update: vi.fn((patch: Record<string, unknown>) => {
        if (patch.is_default === false) {
          return { eq: demoteDefault };
        }
        return {
          eq: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(async () => upsertResult) })) })),
        };
      }),
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(async () => upsertResult) })) })),
    })),
  };
  createServiceSupabaseMock.mockReturnValue(sb as never);
  return { sb, demoteDefault };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listCourierProviders", () => {
  it("returns the provider list", async () => {
    makeSb({ list: { data: [{ id: "p1", name: "Speedy" }], error: null } });
    expect(await listCourierProviders()).toEqual([{ id: "p1", name: "Speedy" }]);
  });

  it("throws on a query error", async () => {
    makeSb({ list: { data: null, error: { message: "db down" } } });
    await expect(listCourierProviders()).rejects.toThrow("db down");
  });
});

describe("upsertCourierProvider", () => {
  it("creates a new provider when no id is given", async () => {
    const { sb } = makeSb({ upsertResult: { data: { id: "new-1" }, error: null } });
    const result = await upsertCourierProvider({ name: "Speedy" });
    expect(result).toEqual({ provider: { id: "new-1" } });
    expect(sb.from).toHaveBeenCalled();
  });

  it("demotes the existing default before creating a new default provider", async () => {
    const { demoteDefault } = makeSb({});
    await upsertCourierProvider({ name: "Speedy", isDefault: true });
    expect(demoteDefault).toHaveBeenCalledWith("is_default", true);
  });

  it("updates an existing provider when id is given", async () => {
    makeSb({ upsertResult: { data: { id: "p1", name: "Updated" }, error: null } });
    const result = await upsertCourierProvider({ id: "p1", name: "Updated" });
    expect(result).toEqual({ provider: { id: "p1", name: "Updated" } });
  });

  it("reports a duplicate name instead of throwing", async () => {
    makeSb({
      upsertResult: { data: null, error: { message: "duplicate key value violates unique constraint" } },
    });
    const result = await upsertCourierProvider({ name: "Speedy" });
    expect(result).toEqual({ provider: null, duplicateName: true });
  });
});

describe("patchCourierProvider", () => {
  it("demotes the existing default before setting a new one", async () => {
    const { demoteDefault } = makeSb({});
    await patchCourierProvider("p1", { isDefault: true });
    expect(demoteDefault).toHaveBeenCalledWith("is_default", true);
  });
});
