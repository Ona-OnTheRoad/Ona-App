const DOC_CACHE_DB = "ona-admin-docs";
const DOC_CACHE_STORE = "files";

function cacheKey(url: string) {
  return url.slice(0, 500);
}

async function openDocDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return null;
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DOC_CACHE_DB, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(DOC_CACHE_STORE)) {
          db.createObjectStore(DOC_CACHE_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/** Read cached blob URL for offline reopen; null if missing. */
export async function readCachedDoc(url: string): Promise<string | null> {
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  const db = await openDocDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(DOC_CACHE_STORE, "readonly");
      const store = tx.objectStore(DOC_CACHE_STORE);
      const g = store.get(cacheKey(url));
      g.onsuccess = () => {
        const blob = g.result as Blob | undefined;
        if (blob instanceof Blob) resolve(URL.createObjectURL(blob));
        else resolve(null);
      };
      g.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/** Prefer admin proxy for private storage / CORS; fall back to direct URL. */
export function proxyDocUrl(
  url: string,
  userId?: string | null,
  kind?: string,
): string {
  if (!url) return url;
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  const q = new URLSearchParams();
  if (userId && kind) {
    q.set("userId", userId);
    q.set("kind", kind);
  } else {
    q.set("url", url);
  }
  return `/api/admin/docs?${q.toString()}`;
}

/** Download once online and store for offline viewing. */
export async function cacheDocUrl(
  url: string,
  opts?: { userId?: string | null; kind?: string },
): Promise<string | null> {
  if (!url || url.startsWith("data:") || url.startsWith("blob:")) return url;
  const candidates = [proxyDocUrl(url, opts?.userId, opts?.kind), url];
  for (const fetchUrl of candidates) {
    try {
      const res = await fetch(fetchUrl, {
        mode: "cors",
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!res.ok) continue;
      const blob = await res.blob();
      if (!blob || blob.size < 8) continue;
      const db = await openDocDb();
      if (db) {
        await new Promise<void>((resolve) => {
          try {
            const tx = db.transaction(DOC_CACHE_STORE, "readwrite");
            tx.objectStore(DOC_CACHE_STORE).put(blob, cacheKey(url));
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
          } catch {
            resolve();
          }
        });
      }
      return URL.createObjectURL(blob);
    } catch {
      /* try next */
    }
  }
  return null;
}
