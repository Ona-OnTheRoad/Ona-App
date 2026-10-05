"use client";

import { VoiceNotePlayer } from "@/components/jobs/voice-note-player";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";

export function ChatMessageBubble({
  msg,
  isPro,
  isLight,
}: {
  msg: ChatMessage;
  isPro: boolean;
  isLight: boolean;
}) {
  if (msg.sender === "system") {
    return (
      <p className="px-2 text-center text-[10px] text-muted">{msg.text}</p>
    );
  }
  const mine =
    (isPro && msg.sender === "professional") ||
    (!isPro && msg.sender === "motorist");
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] space-y-1.5 rounded-2xl px-3 py-2 text-[13px] leading-snug",
          mine ? "rounded-br-md" : "rounded-bl-md",
          // Sent vs received far-apart greys, still elegant in both shells
          mine
            ? isLight
              ? "bg-[#7c7d83] text-white"
              : "bg-[#d6d6db] text-slate-900"
            : isLight
              ? "bg-[#e5e6e9] text-slate-900"
              : "bg-[#1e1e20] text-white/95",
        )}
        style={
          mine
            ? {
                boxShadow: isLight
                  ? "inset 0 1px 0 rgba(255,255,255,0.28)"
                  : "inset 0 1px 0 rgba(255,255,255,0.55)",
              }
            : {
                boxShadow: isLight
                  ? "inset 0 1px 0 rgba(255,255,255,0.6)"
                  : "inset 0 1px 0 rgba(255,255,255,0.05)",
              }
        }
      >
        {msg.text && msg.text !== "Voice note" && <p>{msg.text}</p>}
        {msg.voiceUrl && (
          <VoiceNotePlayer
            url={msg.voiceUrl}
            durationSec={msg.voiceDurationSec}
            isLight={mine ? false : isLight}
            label={mine ? "Your voice" : "Voice note"}
            className={mine ? "bg-black/10" : undefined}
          />
        )}
        {msg.voiceUrl && (!msg.text || msg.text === "Voice note") && (
          <span className="sr-only">Voice note</span>
        )}
      </div>
    </div>
  );
}
