/**
 * Accessibility scan (axe-core, WCAG 2.0/2.1 A + AA + best practices) in real Chrome.
 *
 *   BASE_URL=http://localhost:3000 node axe.mjs [/path,/other] [light|dark]
 *
 * Only screens reachable without an account can be scanned. Exits 1 when any rule fails.
 */
import puppeteer from "puppeteer-core";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const CHROME =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const axeSrc = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const pages = process.argv[2]
  ? process.argv[2].split(",")
  : ["/", "/login", "/login/signin", "/login/role", "/signup/motorist", "/signup/pro", "/settings/legal/terms", "/settings/legal/privacy"];
const theme = process.argv[3] || "";

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
let failing = 0;
for (const path of pages) {
  let res;
  for (let attempt = 0; attempt < 3 && !res; attempt++) {
    const page = await browser.newPage();
    try {
      await page.setViewport({ width: 390, height: 844, isMobile: true });
      if (theme) {
        await page.evaluateOnNewDocument((t) => {
          try { localStorage.setItem("ona-theme", t); } catch {}
        }, theme);
      }
      await page.goto(BASE + path, { waitUntil: "networkidle2" });
      await new Promise((r) => setTimeout(r, 4500)); // let the splash hand off
      await page.evaluate(axeSrc);
      res = await page.evaluate(() =>
        axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] } }),
      );
    } catch (e) {
      console.log(`retry ${path}: ${e.message.split("\n")[0].slice(0, 60)}`);
    } finally {
      await page.close().catch(() => {});
    }
  }
  if (!res) { failing++; console.log(`${path}  could not be scanned`); continue; }
  console.log(`${path}  [${res.violations.length} rules failing]`);
  for (const v of res.violations) {
    failing++;
    console.log(`   ${v.impact.padEnd(8)} ${v.id}  x${v.nodes.length}  ${v.help}`);
    for (const n of v.nodes.slice(0, 2)) console.log(`        ${n.html.slice(0, 110).replace(/\s+/g, " ")}`);
  }
}
await browser.close();
process.exit(failing ? 1 : 0);
