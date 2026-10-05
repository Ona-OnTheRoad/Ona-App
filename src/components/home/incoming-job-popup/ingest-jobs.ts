import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import {
  clearJobShown,
  isIncomingJobOpen,
  isProRequestCardKeepable,
  takeForceIncomingPanelJobId,
} from "@/lib/jobs/incoming-popup-timing";
import type { JobRecord } from "@/lib/jobs/types";
import { serverNow } from "@/lib/jobs/server-clock";
import { MAX_VISIBLE_INCOMING } from "./constants";
import type { NotifyRequestClosed, PanelLevel } from "./types";

export interface IngestDeps {
  backendUserId: string;
  knownIds: MutableRefObject<Set<string>>;
  primed: MutableRefObject<boolean>;
  visibleJobsRef: MutableRefObject<JobRecord[]>;
  queueRef: MutableRefObject<JobRecord[]>;
  missingCountRef: MutableRefObject<Record<string, number>>;
  setOtherCount: Dispatch<SetStateAction<number>>;
  setVisibleJobs: Dispatch<SetStateAction<JobRecord[]>>;
  setQueue: Dispatch<SetStateAction<JobRecord[]>>;
  setLevel: Dispatch<SetStateAction<PanelLevel>>;
  notifyRequestClosed: NotifyRequestClosed;
  presentJob: (j: JobRecord) => Promise<void>;
  offerJob: (j: JobRecord) => void;
}

/** Reconcile one full lean list from the server with the on-screen cards. */
export function ingestIncomingJobs(jobs: JobRecord[], d: IngestDeps): void {
  const {
    backendUserId,
    knownIds,
    primed,
    visibleJobsRef,
    queueRef,
    missingCountRef,
    setOtherCount,
    setVisibleJobs,
    setQueue,
    setLevel,
    notifyRequestClosed,
    presentJob,
    offerJob,
  } = d;
  const now = serverNow();
  const open = jobs.filter((j) => isIncomingJobOpen(j, backendUserId, now));
  setOtherCount(open.length);

  // Cards survive as long as the request is still THIS pro's live request
  // (looser than `open`: it stays through a lapsed pairing window between
  // sweep waves, instead of flickering off then back on).
  const keepIds = new Set(
    jobs
      .filter(
        (j) =>
          j.repairProId === backendUserId &&
          isProRequestCardKeepable(j.status, j.pairingStage),
      )
      .map((j) => j.id),
  );
  // Grace window: only drop a card after it has been missing for 2
  // consecutive polls (covers realtime/Supabase blips without waiting on
  // genuine reassignment/cancellation).
  const dropIds = new Set<string>();
  const findKnownJob = (id: string): JobRecord | null =>
    visibleJobsRef.current.find((j) => j.id === id) ||
    queueRef.current.find((j) => j.id === id) ||
    null;
  for (const [id, n] of Object.entries(missingCountRef.current)) {
    if (keepIds.has(id)) {
      delete missingCountRef.current[id];
    } else {
      missingCountRef.current[id] = n + 1;
      if (n + 1 >= 2) {
        dropIds.add(id);
        delete missingCountRef.current[id];
        // Missing for 2 full polls = no longer this pro's live request
        // (most commonly reassigned to another pro) tell the pro.
        notifyRequestClosed(id, {
          job: findKnownJob(id),
          status: findKnownJob(id)?.status,
          movedOn: true,
        });
      }
    }
  }
  // Explicit close: the job is still listed but the server moved it out of
  // an actionable status (customer cancelled/completed, declined, reassigned
  // to searching, …). Close its card NOW no grace. Grace only covers
  // cards that VANISH from the list (transient realtime blips). Tell the
  // pro why it closed.
  for (const j of jobs) {
    if (
      j.repairProId === backendUserId &&
      !isProRequestCardKeepable(j.status, j.pairingStage)
    ) {
      notifyRequestClosed(j.id, { job: j, status: j.status });
      dropIds.add(j.id);
      delete missingCountRef.current[j.id];
    }
  }

  // Forced open (bounced off full /jobs page → dashboard + panel only,
  // or tapped from the dashboard Incoming requests list). Expand a
  // collapsed/hidden panel so the tapped request is fully visible.
  const forceId = takeForceIncomingPanelJobId();
  if (forceId) {
    const forced = open.find((j) => j.id === forceId);
    if (forced) {
      clearJobShown(forced.id, backendUserId);
      presentJob(forced);
      setLevel("middle");
      knownIds.current.add(forced.id);
      primed.current = true;
      return;
    }
  }

  if (!primed.current) {
    knownIds.current = new Set(open.map((j) => j.id));
    primed.current = true;
    // Surface up to 2 open requests immediately
    for (const j of open.slice(0, MAX_VISIBLE_INCOMING)) {
      offerJob(j);
    }
    // Rest go through offerJob queue path on next polls via knownIds
    for (const j of open.slice(MAX_VISIBLE_INCOMING)) {
      offerJob(j);
    }
    return;
  }

  for (const j of open) {
    if (!knownIds.current.has(j.id)) {
      knownIds.current.add(j.id);
      offerJob(j);
    }
  }

  const openIds = new Set(open.map((j) => j.id));
  for (const id of [...knownIds.current]) {
    if (!openIds.has(id)) knownIds.current.delete(id);
  }

  // Keep visible cards in lockstep with server pairing_deadline
  setVisibleJobs((prev) => {
    let changed = false;
    const next = prev.map((cur) => {
      if (!openIds.has(cur.id)) return cur;
      const fresh = open.find((j) => j.id === cur.id);
      if (!fresh) return cur;
      // Only ADOPT a non-null deadline change. Never let a stale poll
      // result (fetched before the surface arm, or a server that just
      // re-dispatched) overwrite an already-armed deadline with null
      // that flip would hide+reshow the 66s line (the "bounce").
      const freshDeadlineHasValue = Boolean(fresh.pairingDeadline);
      const deadlineChanged =
        freshDeadlineHasValue && fresh.pairingDeadline !== cur.pairingDeadline;
      const restChanged =
        fresh.status !== cur.status || fresh.pairingStage !== cur.pairingStage;
      if (deadlineChanged || restChanged) {
        changed = true;
        return {
          ...cur,
          ...fresh,
          pairingDeadline: fresh.pairingDeadline || cur.pairingDeadline || null,
          photos: cur.photos?.length ? cur.photos : fresh.photos,
          voiceNote: cur.voiceNote || fresh.voiceNote,
          motoristPhoto: cur.motoristPhoto || fresh.motoristPhoto,
        };
      }
      return cur;
    });
    // Drop cards no longer this pro's live request (after grace)
    const kept = next.filter((j) => keepIds.has(j.id) && !dropIds.has(j.id));
    if (kept.length !== prev.length) changed = true;
    if (changed) {
      visibleJobsRef.current = kept;
      return kept;
    }
    return prev;
  });

  // Drop queue items no longer open
  setQueue((prev) => {
    const next = prev.filter((j) => openIds.has(j.id));
    queueRef.current = next;
    return next;
  });

  // If all visible slots emptied (reassigned), promote from queue
  const still = visibleJobsRef.current.filter((j) => openIds.has(j.id));
  if (still.length < MAX_VISIBLE_INCOMING) {
    for (const j of queueRef.current.slice()) {
      if (visibleJobsRef.current.length >= MAX_VISIBLE_INCOMING) break;
      if (openIds.has(j.id)) offerJob(j);
    }
  }
}
