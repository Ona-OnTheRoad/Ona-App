/**
 * Lists the exact colour pairs that fail WCAG AA contrast on a page, so a fix can be chosen.
 *
 *   BASE_URL=http://localhost:3000 node contrast.mjs /signup/pro [light|dark]
 */
import puppeteer from "puppeteer-core";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const CHROME =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const axeSrc = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const pages = (process.argv[2] || "/login/signin").split(",");
const theme = process.argv[3] || "";

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
const pairs = {};
for (const path of pages) {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    if (theme) {
      await page.evaluateOnNewDocument((t) => {
        try { localStorage.setItem("ona-theme", t); } catch {}
      }, theme);
    }
    await page.goto(BASE + path, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 4500));
    await page.evaluate(axeSrc);
    const res = await page.evaluate(() => axe.run(document, { runOnly: { type: "rule", values: ["color-contrast"] } }));
    for (const v of res.violations) for (const n of v.nodes) {
      const d = n.any[0]?.data || {};
      const key = `${d.fgColor} on ${d.bgColor}  ratio ${d.contrastRatio} (needs ${d.expectedContrastRatio})  size ${d.fontSize}`;
      (pairs[key] ??= { count: 0, sample: n.html.slice(0, 90).replace(/\s+/g, " ") }).count++;
    }
  } finally {
    await page.close().catch(() => {});
  }
}
await browser.close();
const rows = Object.entries(pairs).sort((a, b) => b[1].count - a[1].count);
for (const [k, v] of rows) console.log(`${String(v.count).padStart(3)}x  ${k}\n       e.g. ${v.sample}`);
console.log(rows.length ? "" : "No contrast failures.");
process.exit(rows.length ? 1 : 0);
