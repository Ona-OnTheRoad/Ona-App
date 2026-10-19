import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

describe("web app manifest", () => {
  const m = manifest();
  const icons = m.icons ?? [];

  it("is installable: standalone, start_url, scope and a >=144px PNG icon for 'any' purpose", () => {
    expect(m.display).toBe("standalone");
    expect(m.start_url).toBe("/");
    expect(m.scope).toBe("/");
    const ok = icons.filter(
      (i) =>
        i.type === "image/png" &&
        (i.purpose === undefined || i.purpose === "any") &&
        /^\d+x\d+$/.test(i.sizes ?? "") &&
        Number((i.sizes ?? "0x0").split("x")[0]) >= 144,
    );
    expect(ok.length).toBeGreaterThan(0);
  });

  it('never lists an icon with sizes "any" or a non-image type (Chrome then reports no-acceptable-icon)', () => {
    for (const i of icons) {
      expect(i.sizes).toMatch(/^\d+x\d+$/);
      expect(i.type).toBe("image/png");
    }
  });

  it("includes a maskable icon, and every icon file exists in public/", () => {
    expect(icons.some((i) => i.purpose === "maskable")).toBe(true);
    for (const i of icons) {
      expect(existsSync(join(process.cwd(), "public", i.src))).toBe(true);
    }
  });
});
