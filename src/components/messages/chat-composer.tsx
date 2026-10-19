"use client";

import { Loader2, Mic, Send, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PendingVoice, RecPhase } from "./use-voice-recorder";

export function ChatComposer({
  recPhase,
  draft,
  setDraft,
  pendingVoice,
  startRec,
  stopRec,
  send,
  broadcastTyping,
}: {
  isLight?: boolean;
  recPhase: RecPhase;
  draft: string;
  setDraft: (v: string) => void;
  pendingVoice: PendingVoice | null;
  startRec: () => Promise<void>;
  stopRec: () => void;
  send: () => void;
  broadcastTyping: (typing: boolean) => void;
}) {
  const recording = recPhase === "recording";
  const recBusy = recPhase === "arming" || recPhase === "saving";
  return (
    <div className="flex shrink-0 items-center gap-2 border-t border-ona-border bg-ona-bg px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
      <button
        type="button"
        disabled={recBusy}
        onClick={() => (recording ? stopRec() : void startRec())}
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-0 text-white disabled:opacity-70",
          recording || recPhase === "saving"
            ? "bg-ona-danger"
            : "bg-ona-brand-btn",
        )}
        aria-label={
          recording
            ? "Stop recording"
            : recPhase === "arming"
              ? "Starting microphone"
              : recPhase === "saving"
                ? "Saving voice note"
                : "Record voice note"
        }
      >
        {recPhase === "arming" || recPhase === "saving" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : recording ? (
          <Square className="h-4 w-4 fill-current" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </button>
      <input
        value={draft}
        onChange={(e) => {
          const v = e.target.value;
          setDraft(v);
          if (v.trim()) broadcastTyping(true);
          else broadcastTyping(false);
        }}
        onBlur={() => broadcastTyping(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
        placeholder={
          recPhase === "arming"
            ? "Starting mic…"
            : recording
              ? "Recording…"
              : recPhase === "saving"
                ? "Saving voice…"
                : "Type a message…"
        }
        disabled={recording || recBusy}
        className="h-11 min-w-0 flex-1 rounded-ona-ctl border border-ona-border bg-ona-field px-4 text-[14px] text-ona-ink"
        aria-label="Message"
      />
      <button
        type="button"
        onClick={send}
        disabled={recording || recBusy || (!draft.trim() && !pendingVoice)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-ona-ctl border-0 bg-ona-brand-btn text-white disabled:bg-ona-disabled-bg disabled:text-ona-disabled-ink"
        aria-label="Send"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}
