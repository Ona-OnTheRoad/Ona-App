/**
 * End-to-end offline check in real Chrome against a PRODUCTION build (the service worker only
 * runs in production):
 *
 *   npm run build && npm start        # in another terminal, serving BASE_URL
 *   ONA_VERIFY_STOP_CMD='pkill -f "next start"' \
 *   ONA_VERIFY_START_CMD='npm start' \
 *   BASE_URL=http://localhost:3000 node offline.mjs
 *
 * The connection is cut for real by stopping the server (puppeteer's offline mode does not
 * affect a service worker's own requests, so it cannot prove offline behaviour). Without the
 * STOP/START commands the "network down" steps are skipped.
 *
 * Checks: worker installs, caches pages and build files, offline banner, visited page opens with
 * the network down, unvisited page shows /offline.html, recovery, APIs never stored, kill switch.
 */
import puppeteer from "puppeteer-core";
import { execSync, spawn } from "node:child_process";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const CHROME =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const STOP = process.env.ONA_VERIFY_STOP_CMD;
const START = process.env.ONA_VERIFY_START_CMD;
const canCut = Boolean(STOP && START);
const PAGE = "/settings/legal/terms";

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  -> " + detail : ""}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stopServer = () => { try { execSync(STOP, { stdio: "ignore", shell: true }); } catch {} };
async function startServer() {
  spawn(START, { shell: true, stdio: "ignore", detached: true }).unref();
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(BASE + "/robots.txt")).ok) return; } catch {}
    await sleep(500);
  }
  throw new Error("server did not come back");
}
const text = (page) => page.evaluate(() => (document.body?.innerText || "").replace(/\s+/g, " "));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true });

  await page.goto(BASE + PAGE, { waitUntil: "networkidle2" });
  const active = await page.evaluate(async () => {
    for (let i = 0; i < 40; i++) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg?.active?.state === "activated") return true;
      await new Promise((r) => setTimeout(r, 250));
    }
    return false;
  });
  check("service worker registers and activates", active);

  await page.reload({ waitUntil: "networkidle2" });
  await sleep(1500);
  const cached = await page.evaluate(async () => {
    const out = {};
    for (const n of (await caches.keys()).filter((n) => n.startsWith("ona-"))) {
      out[n] = (await (await caches.open(n)).keys()).map((r) => new URL(r.url).pathname);
    }
    return out;
  });
  const pages = Object.entries(cached).find(([n]) => n.startsWith("ona-pages"))?.[1] ?? [];
  const statics = Object.entries(cached).find(([n]) => n.startsWith("ona-static"))?.[1] ?? [];
  check("offline page was precached", pages.includes("/offline.html"));
  check("visited page is stored", pages.includes(PAGE));
  check("hashed build files are stored", statics.length > 3, `${statics.length} files`);

  await page.setOfflineMode(true);
  await sleep(600);
  const banner = await page.evaluate(() => document.querySelector('[role="status"]')?.textContent?.trim() ?? "");
  check("offline banner is announced when the device goes offline", /offline/i.test(banner));
  await page.setOfflineMode(false);
  await sleep(600);
  const back = await page.evaluate(() => document.querySelector('[role="status"]')?.textContent?.trim() ?? "");
  check("banner confirms when back online", /back online/i.test(back));

  if (canCut) {
    stopServer();
    await sleep(1500);
    check("server is really unreachable", await fetch(BASE + "/robots.txt").then(() => false).catch(() => true));
    await page.goto(BASE + PAGE, { waitUntil: "domcontentloaded" }).catch(() => null);
    await sleep(1500);
    check("visited page still opens with the network down", /Terms of Service/i.test(await text(page)));
    await page.goto(BASE + "/some-never-visited-page", { waitUntil: "domcontentloaded" }).catch(() => null);
    await sleep(1500);
    const t = await text(page);
    check("unvisited page shows the branded offline page", /You're offline/i.test(t) && /Try again/i.test(t));
    await startServer();
    await page.goto(BASE + PAGE, { waitUntil: "networkidle2" });
    check("works normally again after the network returns", /Terms of Service/i.test(await text(page)));
  } else {
    console.log("SKIP  network-down steps (set ONA_VERIFY_STOP_CMD and ONA_VERIFY_START_CMD)");
  }

  const apiStored = await page.evaluate(async () => {
    await fetch("/api/config").catch(() => null);
    for (const n of (await caches.keys()).filter((n) => n.startsWith("ona-"))) {
      if ((await (await caches.open(n)).keys()).some((r) => new URL(r.url).pathname.startsWith("/api/"))) return true;
    }
    return false;
  });
  check("API responses are never stored", apiStored === false);

  await page.goto(BASE + PAGE + "?no-sw", { waitUntil: "networkidle2" });
  await sleep(1500);
  const after = await page.evaluate(async () => ({
    regs: (await navigator.serviceWorker.getRegistrations()).length,
    caches: (await caches.keys()).filter((n) => n.startsWith("ona-")).length,
  }));
  check("?no-sw kill switch unregisters the worker and clears caches", after.regs === 0 && after.caches === 0);
} finally {
  await browser.close();
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
