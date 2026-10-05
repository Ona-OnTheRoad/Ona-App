"use client";

import { Loader2, Mic, Send, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PendingVoice, RecPhase } from "./use-voice-recorder";

export function ChatComposer({
  isLight,
  recPhase,
  draft,
  setDraft,
  pendingVoice,
  startRec,
  stopRec,
  send,
  broadcastTyping,
}: {
  isLight: boolean;
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
    <div
      className={cn(
        "flex shrink-0 items-center gap-2 border-t px-3 py-2",
        isLight ? "border-black/10 bg-[#c8c9cd]" : "border-white/10 bg-black",
      )}
    >
      <button
        type="button"
        disabled={recBusy}
        onClick={() => (recording ? stopRec() : void startRec())}
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-0 text-white disabled:opacity-70",
          recording || recPhase === "saving" ? "bg-red-500" : "bg-[#FF6B35]",
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
        className={cn(
          "h-10 min-w-0 flex-1 rounded-full border-0 px-4 text-[13px] outline-none",
          isLight
            ? "bg-[#bebfc4] text-slate-900 placeholder:text-slate-500"
            : "bg-neutral-900 text-white placeholder:text-white/40",
        )}
      />
      <button
        type="button"
        onClick={send}
        disabled={recording || recBusy || (!draft.trim() && !pendingVoice)}
        className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-brand text-white disabled:opacity-40"
        aria-label="Send"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}
