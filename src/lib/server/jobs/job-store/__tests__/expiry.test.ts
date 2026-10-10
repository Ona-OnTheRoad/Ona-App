import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAdminConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabase: vi.fn(),
}));

import { isSupabaseAdminConfigured } from "@/lib/supabase/env";
import { createServiceSupabase } from "@/lib/supabase/server";
import { resetZombieFlowStatuses } from "@/lib/server/jobs/job-store/expiry";

const isSupabaseAdminConfiguredMock = vi.mocked(isSupabaseAdminConfigured);
const createServiceSupabaseMock = vi.mocked(createServiceSupabase);

function makeSb(result: { data: { id: string }[] | null; error?: { message: string } | null }) {
  const query = {
    in: vi.fn(() => query),
    select: vi.fn(async () => result),
  };
  const sb = { from: vi.fn(() => ({ update: vi.fn(() => query) })) };
  createServiceSupabaseMock.mockReturnValue(sb as never);
  return sb;
}

beforeEach(() => {
  vi.clearAllMocks();
  isSupabaseAdminConfiguredMock.mockReturnValue(true);
});

describe("resetZombieFlowStatuses", () => {
  it("returns the count of rows reset", async () => {
    makeSb({ data: [{ id: "a" }, { id: "b" }] });

    expect(await resetZombieFlowStatuses()).toBe(2);
  });

  it("returns 0 when nothing matched", async () => {
    makeSb({ data: [] });

    expect(await resetZombieFlowStatuses()).toBe(0);
  });

  it("returns 0 on a query error, without throwing", async () => {
    makeSb({ data: null, error: { message: "db down" } });

    expect(await resetZombieFlowStatuses()).toBe(0);
  });

  it("returns 0 when admin isn't configured, without querying", async () => {
    isSupabaseAdminConfiguredMock.mockReturnValue(false);

    expect(await resetZombieFlowStatuses()).toBe(0);
    expect(createServiceSupabaseMock).not.toHaveBeenCalled();
  });
});
