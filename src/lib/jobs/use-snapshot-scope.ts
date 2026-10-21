"use client";

import { useEffect, useMemo } from "react";
import { createSnapshotReads } from "./snapshot-reads";

type Group = { readers: ReturnType<typeof createSnapshotReads>; owners: number };
type Lease = { group: Group; active: boolean; isCurrent: () => boolean };
const groups = new Map<string, Group>();

// Mutable lifetime state belongs to this coordinator, rather than to render.
function createScope(key: string | null, resourceScope: string) {
  let lease: Lease | null = null;
  return {
    resourceScope,
    open() {
      if (!key) return;
      let group = groups.get(key);
      if (!group) {
        group = { readers: createSnapshotReads(), owners: 0 };
        groups.set(key, group);
      }
      group.owners++;
      const owned: Lease = { group, active: true, isCurrent: () => owned.active };
      lease = owned;
      return () => {
        owned.active = false;
        if (lease === owned) lease = null;
        if (--group.owners === 0) {
          group.readers.dispose();
          if (groups.get(key) === group) groups.delete(key);
        }
      };
    },
    capture() {
      const current = lease;
      if (!current?.active) return null;
      return {
        isCurrent: current.isCurrent,
        read<T>(resource: string, read: () => Promise<T>, invalidate = false, onCoalesced?: () => void) {
          return current.group.readers.read(resource, read, invalidate, onCoalesced, current.isCurrent);
        },
      };
    },
  };
}

/** Share lanes within a tab/session role. Each consumer has its own lifetime
 * guard, so leaving and returning to A cannot revive A's old callbacks. */
export function useSnapshotScope(userId: string | null | undefined, role: string | null,
  authenticated: boolean, resourceScope = "") {
  const key = authenticated && userId && role ? JSON.stringify([userId, role]) : null;
  // Navigation retires a screen's callbacks while retaining shared lanes for
  // other consumers of the same authenticated scope.
  const scope = useMemo(() => createScope(key, resourceScope), [key, resourceScope]);
  useEffect(() => scope.open(), [scope]);
  return scope;
}
