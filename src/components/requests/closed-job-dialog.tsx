"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExpiredDialog } from "@/components/ui/expired-dialog";
import { JOB_CLOSED_MESSAGE } from "@/lib/chat-expired";

/** "Closed job" popup state: tap a past job, View opens its process summary. */
export function useClosedJobDialog() {
  const [closedOpen, setClosedOpen] = useState(false);
  const [viewHref, setViewHref] = useState<string | null>(null);
  return { closedOpen, setClosedOpen, viewHref, setViewHref };
}

export function ClosedJobDialog({
  closedOpen,
  setClosedOpen,
  viewHref,
  setViewHref,
  isLight,
}: ReturnType<typeof useClosedJobDialog> & { isLight: boolean }) {
  const router = useRouter();
  return (
    <ExpiredDialog
      open={closedOpen}
      isLight={isLight}
      message={JOB_CLOSED_MESSAGE}
      onClose={() => {
        setClosedOpen(false);
        setViewHref(null);
      }}
      onView={
        viewHref
          ? () => {
              const href = viewHref;
              setClosedOpen(false);
              setViewHref(null);
              router.push(href);
            }
          : undefined
      }
    />
  );
}
