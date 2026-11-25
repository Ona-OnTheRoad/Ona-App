import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";
import { OG_IMAGE } from "@/lib/site";

/**
 * Icons and the share image are cached by URL (iOS home screen, the service worker, WhatsApp / X /
 * Facebook). A changed brand image therefore needs a new file name, and every reference must point at a
 * file that exists, or installs and link previews silently lose their image.
 */
const pub = (url: string) => join(process.cwd(), "public", url.replace(/^\//, ""));

describe("brand assets", () => {
  it("every manifest icon exists", () => {
    const icons = manifest().icons ?? [];
    expect(icons.length).toBeGreaterThan(0);
    for (const i of icons) expect(existsSync(pub(i.src)), i.src).toBe(true);
  });

  it("the share image exists", () => {
    expect(existsSync(pub(OG_IMAGE.url))).toBe(true);
  });

  it("the iOS home screen icon referenced by the layout exists", () => {
    const layout = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");
    const ref = layout.match(/url:\s*"(\/icons\/apple-touch-icon[^"]*)"/)?.[1];
    expect(ref).toBeTruthy();
    expect(existsSync(pub(ref!))).toBe(true);
  });

  it("the old man-in-tyre files are gone", () => {
    for (const old of ["/brand/og-image.png", "/icons/apple-touch-icon.png", "/icons/icon-512.png"]) {
      expect(existsSync(pub(old)), old).toBe(false);
    }
  });
});
