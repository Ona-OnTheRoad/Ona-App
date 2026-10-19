"use client";

import { VoiceNotePlayer } from "@/components/jobs/voice-note-player";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";

function timeLabel(at: string): string {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatMessageBubble({
  msg,
  isPro,
  isLight,
  senderName,
}: {
  msg: ChatMessage;
  isPro: boolean;
  isLight: boolean;
  /** Display name of the other party (shown on received bubbles). */
  senderName?: string;
}) {
  if (msg.sender === "system") {
    return (
      <p className="px-2 text-center text-[11px] text-ona-muted">{msg.text}</p>
    );
  }
  const mine =
    (isPro && msg.sender === "professional") ||
    (!isPro && msg.sender === "motorist");
  const time = timeLabel(msg.at);
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] space-y-1.5 rounded-ona-card px-3 py-2.5 text-[13px] leading-snug",
          mine
            ? "bg-ona-dark text-ona-on-dark"
            : "border border-ona-border bg-ona-field-strong text-ona-ink",
        )}
      >
        <div className="flex items-baseline justify-between gap-4 text-[11px]">
          <span className="font-semibold">
            {mine ? "You" : senderName || "Message"}
          </span>
          {time ? (
            <span
              className={mine ? "text-ona-on-dark-muted" : "text-ona-muted"}
            >
              {time}
            </span>
          ) : null}
        </div>
        {msg.text && msg.text !== "Voice note" && <p>{msg.text}</p>}
        {msg.voiceUrl && (
          <VoiceNotePlayer
            url={msg.voiceUrl}
            durationSec={msg.voiceDurationSec}
            isLight={mine ? false : isLight}
            label={mine ? "Your voice" : "Voice note"}
            className={mine ? "bg-white/10" : undefined}
          />
        )}
        {msg.voiceUrl && (!msg.text || msg.text === "Voice note") && (
          <span className="sr-only">Voice note</span>
        )}
      </div>
    </div>
  );
}
