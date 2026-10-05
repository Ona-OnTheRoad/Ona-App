/**
 * Connection awareness for slow, metered and unreliable networks.
 * Pure helpers (testable) plus a React hook in use-network-status.ts.
 */

export type ConnectionQuality = "good" | "fair" | "slow";

export interface NetworkState {
  /** navigator.onLine: false means the device has no connection at all. */
  online: boolean;
  /** slow = 2G / slow-2G / the user turned on Data Saver; fair = 3G; good = everything else. */
  quality: ConnectionQuality;
  /** The user asked the browser to reduce data use. */
  saveData: boolean;
}

/** Shape of navigator.connection (Network Information API; not in every browser). */
export interface NavigatorConnectionLike {
  effectiveType?: string;
  saveData?: boolean;
  addEventListener?: (type: "change", listener: () => void) => void;
  removeEventListener?: (type: "change", listener: () => void) => void;
}

export const DEFAULT_NETWORK_STATE: NetworkState = {
  online: true,
  quality: "good",
  saveData: false,
};

export function connectionOf(
  nav: unknown = typeof navigator === "undefined" ? undefined : navigator,
): NavigatorConnectionLike | undefined {
  const n = nav as { connection?: NavigatorConnectionLike } | undefined;
  return n?.connection;
}

export function qualityFrom(
  conn: Pick<NavigatorConnectionLike, "effectiveType" | "saveData"> | undefined,
): ConnectionQuality {
  if (!conn) return "good";
  if (conn.saveData) return "slow";
  const type = (conn.effectiveType || "").toLowerCase();
  if (type === "slow-2g" || type === "2g") return "slow";
  if (type === "3g") return "fair";
  return "good";
}

export function readNetworkState(
  nav: unknown = typeof navigator === "undefined" ? undefined : navigator,
): NetworkState {
  if (!nav) return DEFAULT_NETWORK_STATE;
  const conn = connectionOf(nav);
  const online = (nav as { onLine?: boolean }).onLine !== false;
  return {
    online,
    quality: qualityFrom(conn),
    saveData: Boolean(conn?.saveData),
  };
}

/** Stable key so a hook can return the same object while nothing changed. */
export function networkStateKey(s: NetworkState): string {
  return `${s.online ? 1 : 0}|${s.quality}|${s.saveData ? 1 : 0}`;
}
