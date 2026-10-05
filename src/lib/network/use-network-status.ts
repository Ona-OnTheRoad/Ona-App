"use client";

import { useSyncExternalStore } from "react";
import {
  DEFAULT_NETWORK_STATE,
  connectionOf,
  networkStateKey,
  readNetworkState,
  type NetworkState,
} from "@/lib/network/connection";

let cached: NetworkState = DEFAULT_NETWORK_STATE;
let cachedKey = networkStateKey(DEFAULT_NETWORK_STATE);

/** Same object until something actually changes (required by useSyncExternalStore). */
function getSnapshot(): NetworkState {
  const next = readNetworkState();
  const key = networkStateKey(next);
  if (key !== cachedKey) {
    cached = next;
    cachedKey = key;
  }
  return cached;
}

function getServerSnapshot(): NetworkState {
  return DEFAULT_NETWORK_STATE;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  const conn = connectionOf();
  conn?.addEventListener?.("change", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
    conn?.removeEventListener?.("change", onChange);
  };
}

/** Live online/offline, connection quality and Data Saver state. SSR-safe (assumes online). */
export function useNetworkStatus(): NetworkState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
