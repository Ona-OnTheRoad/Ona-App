import { describe, expect, it } from "vitest";
import { compareNames, nameTokens } from "@/lib/server/identity/name-match";

const holder = { fullName: "Adaeze Ngozi Okafor", firstName: "Adaeze", lastName: "Okafor" };

describe("nameTokens", () => {
  it("lowercases, strips accents and punctuation, drops initials", () => {
    expect(nameTokens("  Adaézè  O'KAFOR-Bello, J. ")).toEqual(["adaeze", "okafor", "bello"]);
    expect(nameTokens(null)).toEqual([]);
  });
});

describe("compareNames", () => {
  it.each([
    "Adaeze Okafor",
    "OKAFOR ADAEZE",
    "okafor,  adaeze ngozi",
    "Okafor Ngozi",
    "Mrs Adaeze N. Okafor",
  ])("matches %j whatever the case, spacing or order", (candidate) => {
    expect(compareNames(holder, candidate)).toBe("match");
  });

  it("needs the surname, not just given names", () => {
    expect(compareNames(holder, "Adaeze Ngozi Bello")).toBe("mismatch");
  });

  it("needs one other name besides the surname", () => {
    expect(compareNames(holder, "Chidi Okafor")).toBe("mismatch");
  });

  it("requires every part of a double surname", () => {
    const double = { firstName: "Tunde", lastName: "Ade-Ojo" };
    expect(compareNames(double, "Tunde Ade Ojo")).toBe("match");
    expect(compareNames(double, "Tunde Ade")).toBe("mismatch");
  });

  it("falls back to two shared names when the provider gives no surname", () => {
    expect(compareNames({ fullName: "Adaeze Ngozi Okafor" }, "Okafor Adaeze")).toBe("match");
    expect(compareNames({ fullName: "Adaeze Ngozi Okafor" }, "Okafor Chidi")).toBe("mismatch");
  });

  it.each([null, "", "Okafor", "A B"])("is unknown when %j is too little to compare", (candidate) => {
    expect(compareNames(holder, candidate)).toBe("unknown");
  });

  it("is unknown when the provider returned no name", () => {
    expect(compareNames({}, "Adaeze Okafor")).toBe("unknown");
  });
});
