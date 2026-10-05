/* Ona service worker: web push + safe offline caching for slow and unreliable networks.
 *
 * Caching rules (deliberately conservative; a service worker bug can strand users):
 *  - Only same-origin GET requests are handled. APIs, /admin, other origins (Supabase, Google,
 *    Flutterwave) and Range requests always go straight to the network.
 *  - /_next/static/* (content-hashed build files): cache-first. They never change.
 *  - Public images and icons: stale-while-revalidate (instant from cache, refreshed in the background).
 *  - Page navigations: network-first. If the network is slow (> NAV_NETWORK_TIMEOUT_MS) and a previous
 *    copy exists, that copy is shown while the fresh one loads in the background. If the network is
 *    down, the last good copy is shown, else /offline.html. Only query-less pages are stored, so URLs
 *    carrying tokens, payment references or codes are never kept.
 *  - Mutations (POST etc.) are never queued or replayed here: money and job actions must be explicit.
 *
 * Kill switch: open the app with ?no-sw or set localStorage "ona-sw-disabled" to "1"; the registrar
 * unregisters this worker and clears its caches. Bump SW_VERSION to invalidate every cache.
 *
 * Push payloads are { title, body, url, tag, icon }. The worker is registered at app start for
 * caching; the push client (src/lib/push/client.ts) registers the same /sw.js when push is enabled.
 */
const SW_VERSION = "2026-10-05-1";
const STATIC_CACHE = "ona-static-" + SW_VERSION;
const MEDIA_CACHE = "ona-media-" + SW_VERSION;
const PAGE_CACHE = "ona-pages-" + SW_VERSION;
const KEEP_CACHES = [STATIC_CACHE, MEDIA_CACHE, PAGE_CACHE];
const OFFLINE_URL = "/offline.html";
const NAV_NETWORK_TIMEOUT_MS = 4000;
const MAX_ENTRIES = {};
MAX_ENTRIES[STATIC_CACHE] = 250;
MAX_ENTRIES[MEDIA_CACHE] = 120;
MAX_ENTRIES[PAGE_CACHE] = 25;

/** Pages that must never be stored (money, sign-in tokens, session end). */
const NEVER_CACHE_PAGES = ["/payments", "/logout", "/login/reset-password", "/admin"];
const MEDIA_PREFIXES = [
  "/brand/",
  "/icons/",
  "/images/",
  "/media/",
  "/technicians/",
  "/shop/automedics/",
  "/_next/image",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGE_CACHE)
      .then((cache) => cache.add(OFFLINE_URL))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n.indexOf("ona-") === 0 && KEEP_CACHES.indexOf(n) === -1)
          .map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "CLEAR_CACHES") {
    event.waitUntil(
      caches.keys().then((names) =>
        Promise.all(names.filter((n) => n.indexOf("ona-") === 0).map((n) => caches.delete(n))),
      ),
    );
  }
});

function startsWithAny(path, prefixes) {
  for (let i = 0; i < prefixes.length; i++) {
    if (path.indexOf(prefixes[i]) === 0) return true;
  }
  return false;
}

/** Keep each cache bounded: drop the oldest entries beyond the limit. */
async function trim(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const extra = keys.length - MAX_ENTRIES[cacheName];
  for (let i = 0; i < extra; i++) await cache.delete(keys[i]);
}

function isCacheable(res) {
  return res && res.status === 200 && res.type === "basic";
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (isCacheable(res)) {
    cache.put(request, res.clone()).then(() => trim(cacheName));
  }
  return res;
}

async function staleWhileRevalidate(event, cacheName) {
  const request = event.request;
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const refresh = fetch(request)
    .then((res) => {
      if (isCacheable(res)) {
        cache.put(request, res.clone()).then(() => trim(cacheName));
      }
      return res;
    })
    .catch(() => undefined);
  if (hit) {
    event.waitUntil(refresh);
    return hit;
  }
  const fresh = await refresh;
  return fresh || Response.error();
}

function isHtml(res) {
  const type = res.headers.get("content-type") || "";
  return type.indexOf("text/html") !== -1;
}

async function networkFirstPage(event) {
  const request = event.request;
  const url = new URL(request.url);
  const storable = url.search === "" && !startsWithAny(url.pathname, NEVER_CACHE_PAGES);
  const cache = await caches.open(PAGE_CACHE);
  const cached = storable ? await cache.match(request) : undefined;

  const network = fetch(request).then((res) => {
    if (storable && isCacheable(res) && !res.redirected && isHtml(res)) {
      cache.put(request, res.clone()).then(() => trim(PAGE_CACHE));
    }
    return res;
  });
  // Let a slow response finish and refresh the cache even after we answered from it.
  event.waitUntil(network.catch(() => undefined));

  try {
    if (cached) {
      const slow = new Promise((resolve) => setTimeout(() => resolve(cached), NAV_NETWORK_TIMEOUT_MS));
      return await Promise.race([network, slow]);
    }
    return await network;
  } catch {
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    return offline || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  if (request.headers.has("range")) return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const path = url.pathname;
  if (path.indexOf("/api/") === 0 || path.indexOf("/admin") === 0) return;

  if (path.indexOf("/_next/static/") === 0) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
  if (startsWithAny(path, MEDIA_PREFIXES)) {
    event.respondWith(staleWhileRevalidate(event, MEDIA_CACHE));
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(event));
  }
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    /* keep defaults */
  }
  const title = data.title || "Ona";
  const options = {
    body: data.body || "",
    tag: data.tag || "",
    data: { url: data.url || "" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "";
  event.waitUntil(
    (async () => {
      const existing = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of existing) {
        if ("focus" in client) {
          await client.focus();
          if (url && "navigate" in client) {
            try {
              await client.navigate(url);
            } catch {
              /* cross-context navigate may fail; focus is enough */
            }
          }
          return;
        }
      }
      if (url) await self.clients.openWindow(url);
    })(),
  );
});
