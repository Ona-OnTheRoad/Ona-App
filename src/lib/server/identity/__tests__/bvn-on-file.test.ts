import { describe, expect, it } from "vitest";
import { bvnOnFile } from "../bvn-on-file";

describe("bvnOnFile", () => {
  it("is false with no row or only a government ID", () => {
    expect(bvnOnFile(null)).toBe(false);
    expect(bvnOnFile({})).toBe(false);
    expect(bvnOnFile({ gov_id_meta: { primaryId: "123", bankId: null } })).toBe(false);
  });
  it.each([
    [{ bvn_encrypted: "12345678901" }],
    [{ bvn_last4: "8901" }],
    [{ bank_id_number: "12345678901" }],
    [{ gov_id_meta: { bankId: "12345678901" } }],
    [{ gov_id_meta: { bvn: "12345678901" } }],
  ])("is true when a BVN was submitted: %j", (row) => {
    expect(bvnOnFile(row)).toBe(true);
  });
  it("ignores array or non-object meta", () => {
    expect(bvnOnFile({ gov_id_meta: ["bankId"] })).toBe(false);
    expect(bvnOnFile({ gov_id_meta: "bankId" })).toBe(false);
  });
});
