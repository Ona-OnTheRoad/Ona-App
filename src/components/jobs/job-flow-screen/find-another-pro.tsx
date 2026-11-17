"use client";

import { useState } from "react";
import { ConfirmCancelSheet } from "@/components/ui/confirm-cancel-sheet";

/**
 * Customer-only escape hatch during negotiation: reject this pro and put the
 * request back out to every other pro nearby (closest first). The rejected pro
 * is excluded for this request, the negotiation so far is cleared, and nothing
 * has been paid, so there is nothing to refund.
 */
export function FindAnotherPro({
  isLight,
  busy,
  onConfirm,
}: {
  isLight: boolean;
  busy: boolean;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => setOpen(true)}
        className="mx-auto block min-h-11 border-0 bg-transparent px-3 text-[13px] font-semibold text-ona-brand-ink underline-offset-2 hover:underline disabled:opacity-50"
      >
        Not happy? Find another pro
      </button>
      <ConfirmCancelSheet
        open={open}
        isLight={isLight}
        title="Find another pro?"
        message="This pro will be removed from your request and nearby pros will be alerted again. Any price you discussed is cleared."
        confirmLabel="Yes, find another pro"
        keepLabel="Keep this pro"
        onClose={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          onConfirm();
        }}
      />
    </>
  );
}
