import { describe, expect, it, vi } from "vitest";
import { FakeSupabase } from "@/test-utils/fake-supabase";
import {
  guarantorInputSchema,
  normalizeGuarantor,
  partialGuarantorInputSchema,
  persistGuarantor,
} from "../guarantor";

describe("guarantor helpers", () => {
  it("normalizeGuarantor supports snake_case and camelCase rows", () => {
    expect(
      normalizeGuarantor({
        full_name: "Bola Guarantor",
        phone: "08012345678",
        address: "12 Allen Ave",
        occupation: "Engineer",
        relationship: "Brother",
        linked_user_id: "u-9",
      }),
    ).toEqual({
      fullName: "Bola Guarantor",
      phone: "08012345678",
      address: "12 Allen Ave",
      occupation: "Engineer",
      relationship: "Brother",
      linkedUserId: "u-9",
    });
    expect(normalizeGuarantor({ full_name: "  ", phone: "" })).toBeUndefined();
  });

  it("persistGuarantor with mergeExisting preserves existing relationship, address and occupation", async () => {
    const db = new FakeSupabase({
      repair_pro_guarantors: [
        {
          user_id: "user-1",
          full_name: "Bola Guarantor",
          phone: "08012345678",
          address: "12 Allen Ave, Ikeja",
          occupation: "Civil Servant",
          relationship: "Uncle",
        },
      ],
      repair_pro_profiles: [
        {
          user_id: "user-1",
          primary_service: "mechanic",
          guarantor: {
            fullName: "Bola Guarantor",
            phone: "08012345678",
            address: "12 Allen Ave, Ikeja",
            occupation: "Civil Servant",
            relationship: "Uncle",
          },
        },
      ],
    });

    // Simulate onboarding sending only { fullName, phone } or generic "Guarantor" placeholder
    const res = await persistGuarantor(
      db as never,
      "user-1",
      {
        fullName: "Bola Guarantor",
        phone: "08012345678",
        relationship: "Guarantor",
      },
      { mergeExisting: true },
    );

    expect(res).toEqual({
      ok: true,
      guarantor: {
        fullName: "Bola Guarantor",
        phone: "08012345678",
        address: "12 Allen Ave, Ikeja",
        occupation: "Civil Servant",
        relationship: "Uncle",
      },
    });
    expect(db.rows.repair_pro_guarantors[0]).toMatchObject({
      full_name: "Bola Guarantor",
      phone: "08012345678",
      address: "12 Allen Ave, Ikeja",
      occupation: "Civil Servant",
      relationship: "Uncle",
    });
    expect(db.rows.repair_pro_profiles[0].guarantor).toEqual({
      fullName: "Bola Guarantor",
      phone: "08012345678",
      address: "12 Allen Ave, Ikeja",
      occupation: "Civil Servant",
      relationship: "Uncle",
    });
  });

  it("returns error instead of swallowing Supabase { error } on table or JSONB write failure", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const tableFailDb = {
      from: (table: string) => ({
        upsert: async () =>
          table === "repair_pro_guarantors"
            ? { data: null, error: { message: "table write denied" } }
            : { data: null, error: null },
        update: () => ({
          eq: async () => ({ data: null, error: null }),
        }),
      }),
    };
    const r1 = await persistGuarantor(tableFailDb as never, "user-1", {
      fullName: "Bola Guarantor",
      phone: "08012345678",
      relationship: "Brother",
    });
    expect(r1).toEqual({ ok: false, error: "table write denied" });

    const jsonFailDb = {
      from: () => ({
        upsert: async () => ({ data: null, error: null }),
        update: () => ({
          eq: async () => ({
            data: null,
            error: { message: "jsonb write failed" },
          }),
        }),
      }),
    };
    const r2 = await persistGuarantor(jsonFailDb as never, "user-1", {
      fullName: "Bola Guarantor",
      phone: "08012345678",
      relationship: "Brother",
    });
    expect(r2).toEqual({ ok: false, error: "jsonb write failed" });
  });

  it("validates shared guarantor Zod schemas consistently", () => {
    expect(
      guarantorInputSchema.safeParse({
        fullName: "",
        phone: "08012345678",
        relationship: "Brother",
      }).success,
    ).toBe(false);
    expect(
      guarantorInputSchema.safeParse({
        fullName: "Bola",
        phone: "123",
        relationship: "Brother",
      }).success,
    ).toBe(false);
    expect(
      partialGuarantorInputSchema.safeParse({
        fullName: "Bola",
        phone: "08012345678",
      }).success,
    ).toBe(true);
  });
});
