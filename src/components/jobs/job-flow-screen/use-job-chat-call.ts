import { useCallback } from "react";
import type { useRouter } from "next/navigation";
import { useInAppCall } from "@/components/call/in-app-call";
import { isJobEndedStatus } from "@/lib/chat-expired";
import type { JobRecord } from "@/lib/jobs/types";
import { PRO_SERVICE_LABELS } from "@/lib/services";
import { useApp } from "@/lib/store";
import type { ServiceRequest } from "@/lib/types";
import type { JobViewer } from "./types";

type StartCall = ReturnType<typeof useInAppCall>["startCall"];
type AppStore = ReturnType<typeof useApp>;

interface Args {
  router: ReturnType<typeof useRouter>;
  startCall: StartCall;
  viewer: JobViewer;
  technicians: AppStore["technicians"];
  ensureChatForRequestAsync: AppStore["ensureChatForRequestAsync"];
  visibleMessageThreads: AppStore["visibleMessageThreads"];
  setFlash: (v: string | null) => void;
  setChatGateOpen: (v: boolean) => void;
  setChatGateViewHref: (v: string | null) => void;
}

/** Job-scoped Call + Chat actions (in-app call, cloud chat thread). */
export function useJobChatCall({
  router,
  startCall,
  viewer,
  technicians,
  ensureChatForRequestAsync,
  visibleMessageThreads,
  setFlash,
  setChatGateOpen,
  setChatGateViewHref,
}: Args) {
  /** Open (or create) cloud job chat so both parties share one conversation */
  const openJobChat = useCallback(
    async (j: JobRecord) => {
      if (isJobEndedStatus(j.status)) {
        const { readOnlyChatHref } = await import("@/lib/chat-expired");
        const existing = visibleMessageThreads.find(
          (t) =>
            (t.requestId === j.id && !t.id.startsWith("chat-")) ||
            t.id === `chat-${j.id}`,
        );
        // Message on ended job → conversation copy; still gated
        setChatGateViewHref(
          existing && !existing.id.startsWith("chat-")
            ? readOnlyChatHref(existing.id)
            : `/requests/${j.id}`,
        );
        setChatGateOpen(true);
        return;
      }
      const existing = visibleMessageThreads.find(
        (t) =>
          (t.requestId === j.id && !t.id.startsWith("chat-")) ||
          t.id === `chat-${j.id}`,
      );
      if (existing && !existing.id.startsWith("chat-")) {
        router.push(`/messages/${existing.id}`);
        return;
      }
      const req: ServiceRequest = {
        id: j.id,
        technicianId: j.repairProId,
        technicianName: j.repairProName,
        motoristId: j.motoristId,
        serviceType: j.serviceType,
        problem: j.problem,
        status: "accepted",
        createdAt: j.createdAt,
        etaMinutes: j.etaMinutes ?? 0,
        distanceKm: j.distanceKm ?? 0,
        locationLabel: j.locationLabel,
      };
      setFlash("Opening chat…");
      try {
        const threadId = await ensureChatForRequestAsync(req);
        setFlash(null);
        router.push(`/messages/${threadId}`);
      } catch {
        setFlash("Could not open chat. Try again.");
        window.setTimeout(() => setFlash(null), 3000);
      }
    },
    [
      ensureChatForRequestAsync,
      router,
      visibleMessageThreads,
      setFlash,
      setChatGateOpen,
      setChatGateViewHref,
    ],
  );

  const startJobCall = useCallback(
    (j: JobRecord) => {
      if (viewer === "motorist") {
        const tech =
          technicians.find((t) => t.id === j.repairProId) ||
          technicians.find(
            (t) =>
              t.name === j.repairProName && t.serviceType === j.serviceType,
          );
        const phone = (j.repairProPhone || tech?.phone || "").trim();
        const peerId = j.repairProId;
        if (!phone && !peerId) {
          setFlash("Cannot call no in-app peer or phone. Use Message.");
          window.setTimeout(() => setFlash(null), 3500);
          return;
        }
        // Prefer in-app WebRTC when peer id known; phone is fallback
        startCall({
          name: j.repairProName,
          phone,
          photo: j.repairProPhoto || tech?.photo,
          roleLabel: PRO_SERVICE_LABELS[j.serviceType] || "Repair Pro",
          userId: peerId || undefined,
          jobId: j.id,
        });
        return;
      }
      const phone = (j.motoristPhone || "").trim();
      const peerId = j.motoristId;
      if (!phone && !peerId) {
        setFlash("Cannot call no in-app peer or phone. Use Message.");
        window.setTimeout(() => setFlash(null), 3500);
        return;
      }
      startCall({
        name: j.motoristName,
        phone,
        photo: j.motoristPhoto || undefined,
        roleLabel: "Customer",
        userId: peerId || undefined,
        jobId: j.id,
      });
    },
    [startCall, technicians, viewer, setFlash],
  );
  return { openJobChat, startJobCall };
}
