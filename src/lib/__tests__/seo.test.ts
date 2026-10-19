import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { isWelcomeRoute } from "@/components/auth/auth-gate/boot-routes";
import { isPublicPath } from "@/lib/routes";
import {
  DEFAULT_SITE_URL,
  INDEXABLE_PATHS,
  PRIVATE_PATH_PREFIXES,
  PUBLIC_EXCEPTIONS,
  absoluteUrl,
  siteUrl,
} from "@/lib/site";

const APP_DIR = join(process.cwd(), "src/app");

/** Longest-match rule that Google and Bing use: the most specific Allow/Disallow wins. */
function isCrawlable(path: string): boolean {
  const matches = (prefix: string) =>
    path === prefix || path.startsWith(`${prefix}/`);
  const allow = [...PUBLIC_EXCEPTIONS].filter(matches);
  const disallow = [...PRIVATE_PATH_PREFIXES].filter(matches);
  const longest = (xs: string[]) => Math.max(0, ...xs.map((x) => x.length));
  return longest(allow) >= longest(disallow);
}

function stripGroups(dir: string): string {
  const segs = relative(APP_DIR, dir)
    .split("/")
    .filter((s) => s && !(s.startsWith("(") && s.endsWith(")")));
  return `/${segs.join("/")}`;
}

function pageFiles(dir = APP_DIR, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) pageFiles(full, out);
    else if (name === "page.tsx") out.push(full);
  }
  return out;
}

/** True when this page or any ancestor layout exports the NOINDEX metadata. */
function underNoindexLayout(pageFile: string): boolean {
  let dir = dirname(pageFile);
  while (dir.startsWith(APP_DIR)) {
    const layout = join(dir, "layout.tsx");
    if (existsSync(layout)) {
      const src = readFileSync(layout, "utf8");
      if (/\bNOINDEX(_FOLLOW)?\b/.test(src) || /index:\s*false/.test(src)) {
        return true;
      }
    }
    dir = dirname(dir);
  }
  return false;
}

describe("site URL", () => {
  const original = process.env.NEXT_PUBLIC_APP_URL;
  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = original;
  });

  it("defaults to the production app and trims trailing slashes", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(siteUrl()).toBe(DEFAULT_SITE_URL);
    process.env.NEXT_PUBLIC_APP_URL = "https://example.ng///";
    expect(siteUrl()).toBe("https://example.ng");
    expect(absoluteUrl("/x")).toBe("https://example.ng/x");
    expect(absoluteUrl("y")).toBe("https://example.ng/y");
  });
});

describe("site URL on a hosting platform", () => {
  const keys = [
    "NEXT_PUBLIC_APP_URL",
    "NETLIFY",
    "VERCEL",
    "URL",
    "VERCEL_PROJECT_PRODUCTION_URL",
  ] as const;
  const saved: Record<string, string | undefined> = {};
  const clear = () => keys.forEach((k) => delete process.env[k]);
  afterEach(() => {
    clear();
    keys.forEach((k) => {
      if (saved[k] !== undefined) process.env[k] = saved[k];
    });
  });
  const stash = () => keys.forEach((k) => (saved[k] = process.env[k]));

  it("ignores a copied localhost NEXT_PUBLIC_APP_URL on Netlify and uses the platform URL", () => {
    stash();
    clear();
    process.env.NETLIFY = "true";
    process.env.URL = "https://ona.example.ng";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    expect(siteUrl()).toBe("https://ona.example.ng");
    expect(absoluteUrl("/brand/og-image.png")).toBe(
      "https://ona.example.ng/brand/og-image.png",
    );
  });

  it("falls back to the default when the platform gives no URL either", () => {
    stash();
    clear();
    process.env.VERCEL = "1";
    process.env.NEXT_PUBLIC_APP_URL = "http://127.0.0.1:3000/";
    expect(siteUrl()).toBe(DEFAULT_SITE_URL);
  });

  it("still honours a real NEXT_PUBLIC_APP_URL on the platform, and localhost off-platform", () => {
    stash();
    clear();
    process.env.NETLIFY = "true";
    process.env.URL = "https://other.example.ng";
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.ng/";
    expect(siteUrl()).toBe("https://app.example.ng");
    clear();
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    expect(siteUrl()).toBe("http://localhost:3000");
  });
});

describe("robots and sitemap", () => {
  it("lists only crawlable, indexable pages in the sitemap", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toEqual(INDEXABLE_PATHS.map((p) => absoluteUrl(p)));
    for (const p of INDEXABLE_PATHS) expect(isCrawlable(p)).toBe(true);
  });

  it("blocks private areas but re-allows the public legal pages", () => {
    const rules = robots().rules;
    const rule = (Array.isArray(rules) ? rules[0] : rules) as {
      allow?: string | string[];
      disallow?: string | string[];
    };
    expect(rule.disallow).toEqual(
      expect.arrayContaining(["/admin", "/api", "/shop"]),
    );
    expect(rule.allow).toEqual(
      expect.arrayContaining(["/", "/settings/legal"]),
    );
    expect(isCrawlable("/settings/legal/terms")).toBe(true);
    expect(isCrawlable("/settings/security")).toBe(false);
    expect(isCrawlable("/shop/p/abc")).toBe(false);
    expect(robots().sitemap).toBe(absoluteUrl("/sitemap.xml"));
  });
});

describe("indexable pages are reachable without signing in", () => {
  it("every indexable path is public or the guest welcome route", () => {
    for (const p of INDEXABLE_PATHS) {
      expect(p === "/" ? isWelcomeRoute(p) : isPublicPath(p)).toBe(true);
    }
  });

  it("every indexable path has a page file", () => {
    const urls = new Set(pageFiles().map((f) => stripGroups(dirname(f))));
    for (const p of INDEXABLE_PATHS) expect(urls.has(p)).toBe(true);
  });
});

describe("private pages stay out of search results", () => {
  it("every non-indexable page sits under a noindex layout", () => {
    const missing = pageFiles()
      .map((f) => ({ f, url: stripGroups(dirname(f)) }))
      .filter(
        ({ url }) => !(INDEXABLE_PATHS as readonly string[]).includes(url),
      )
      .filter(({ url }) => url !== "/settings/legal") // hub inherits the settings noindex
      .filter(({ f }) => !underNoindexLayout(f))
      .map(({ url }) => url);
    expect(missing).toEqual([]);
  });
});
