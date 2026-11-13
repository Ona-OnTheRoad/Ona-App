import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Cheap static guards for accessibility defects that are easy to reintroduce and
 * impossible to spot in review. They scan the source, not the rendered page.
 */
const ROOT = join(process.cwd(), "src");

function tsxFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === "__tests__" || name === "node_modules") continue;
      tsxFiles(p, out);
    } else if (p.endsWith(".tsx")) out.push(p);
  }
  return out;
}

/** End index of an opening tag that starts at `from` (brace-aware, so `=>` inside props is not a tag end). */
function openingTagEnd(src: string, from: number): number {
  let depth = 0;
  for (let i = from; i < src.length; i++) {
    const c = src[i];
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === ">" && depth === 0) return i;
  }
  return -1;
}

export function findUnnamedImageButtons(src: string): number[] {
  const lines: number[] = [];
  for (const m of src.matchAll(/alt=""/g)) {
    const at = m.index!;
    const b = src.lastIndexOf("<button", at);
    if (b < 0 || src.slice(b, at).includes("</button>")) continue;
    const end = src.indexOf("</button>", at);
    if (end < 0) continue;
    const tagEnd = openingTagEnd(src, b + "<button".length);
    if (tagEnd < 0 || tagEnd > at) continue;
    const attrs = src.slice(b, tagEnd);
    const inner = src
      .slice(tagEnd + 1, end)
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
      .replace(/<[^>]*>/g, "")
      .replace(/\{[^{}]*\}/g, "")
      .trim();
    if (!inner && !/aria-label|aria-labelledby|title=/.test(attrs)) {
      lines.push(src.slice(0, b).split("\n").length);
    }
  }
  return lines;
}

describe("static accessibility guards", () => {
  it("the detector flags an image-only button and accepts a named one", () => {
    const bad = `<button onClick={() => go()}><img src={u} alt="" /></button>`;
    const named = `<button onClick={() => go()} aria-label="Remove"><img src={u} alt="" /></button>`;
    const withText = `<button><img src={u} alt="" /> Remove</button>`;
    expect(findUnnamedImageButtons(bad)).toHaveLength(1);
    expect(findUnnamedImageButtons(named)).toHaveLength(0);
    expect(findUnnamedImageButtons(withText)).toHaveLength(0);
  });

  it("no <button> in src/ contains only a decorative image (alt=\"\") and has no accessible name", () => {
    const offenders: string[] = [];
    for (const f of tsxFiles(ROOT)) {
      for (const line of findUnnamedImageButtons(readFileSync(f, "utf8"))) {
        offenders.push(`${f.replace(process.cwd() + "/", "")}:${line}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("no show/hide-password toggle is removed from the keyboard tab order", () => {
    const offenders: string[] = [];
    for (const f of tsxFiles(ROOT)) {
      const src = readFileSync(f, "utf8");
      for (const m of src.matchAll(/<button\b[^>]*?tabIndex=\{-1\}[^>]*?>/g)) {
        if (/(show|hide)[^"']*password/i.test(m[0])) offenders.push(f.replace(process.cwd() + "/", ""));
      }
    }
    expect(offenders).toEqual([]);
  });
});
