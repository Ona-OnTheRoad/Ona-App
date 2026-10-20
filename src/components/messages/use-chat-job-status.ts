"use client";

import { useEffect, useRef, useState } from "react";
import { isJobEndedStatus } from "@/lib/chat-expired";
import { apiGetJob } from "@/lib/jobs/client";

/**
 * Job ended: lock send. Without ?view=1 → popup (View = read-only, OK = leave).
 */
export function useChatJobStatus(
  requestId: string | null | undefined,
  intentionalViewOnly: boolean,
) {
  /** Job ended no send */
  const [chatClosed, setChatClosed] = useState(false);
  /** 2B mid-session end: popup until View (read-only) or OK (leave) */
  const [expiredOpen, setExpiredOpen] = useState(false);
  const promptedForEnd = useRef(false);

  useEffect(() => {
    const rid = requestId;
    if (!rid || rid.startsWith("chat-") || rid.startsWith("demo-")) {
      setChatClosed(false);
      return;
    }
    let cancelled = false;

    const check = (trigger: "initial" | "interval" = "initial") => {
      void apiGetJob(rid, { source: "chat", trigger }).then((res) => {
        if (cancelled || !res.ok) return;
        const ended = isJobEndedStatus(res.data.job.status);
        if (!ended) {
          setChatClosed(false);
          promptedForEnd.current = false;
          return;
        }
        setChatClosed(true);
        // Intentional View (?view=1) → stay read-only, no kick
        if (intentionalViewOnly) return;
        // 2B: mid-session or deep-link without View → offer popup once
        if (!promptedForEnd.current) {
          promptedForEnd.current = true;
          setExpiredOpen(true);
        }
      });
    };

    check();
    const t = window.setInterval(() => {
      if (document.hidden) return;
      check("interval");
    }, 45_000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [requestId, intentionalViewOnly]);

  return { chatClosed, expiredOpen, setExpiredOpen };
}
