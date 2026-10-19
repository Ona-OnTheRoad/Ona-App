import { describe, expect, it } from "vitest";
import { composeFullName, splitFullName } from "./name-utils";

describe("name utils", () => {
  it("composes and trims", () => {
    expect(composeFullName(" Ada ", " Okafor ")).toBe("Ada Okafor");
    expect(composeFullName("Ada", "")).toBe("Ada");
    expect(composeFullName("", "")).toBe("");
  });
  it("splits on the first space", () => {
    expect(splitFullName("Ada Okafor")).toEqual({
      first: "Ada",
      last: "Okafor",
    });
    expect(splitFullName("Ada Mary  Okafor")).toEqual({
      first: "Ada",
      last: "Mary Okafor",
    });
    expect(splitFullName("Ada")).toEqual({ first: "Ada", last: "" });
  });
  it("round-trips a stored name", () => {
    const { first, last } = splitFullName("Chidi Eze Jr");
    expect(composeFullName(first, last)).toBe("Chidi Eze Jr");
  });
});
