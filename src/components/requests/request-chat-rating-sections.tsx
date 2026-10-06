import { ChevronRight, MessageCircle, Star } from "lucide-react";
import type { JobRecord } from "@/lib/jobs/types";
import { cn } from "@/lib/utils";
import type { MessageThread } from "@/lib/types";
import { formatWhenShort } from "./format-when";
import { Section } from "./request-detail-primitives";

export function RequestChatRatingSections({
  job,
  chatThread,
  onOpenChat,
  isLight,
  ink,
  muted,
}: {
  job: JobRecord;
  chatThread: MessageThread | null;
  onOpenChat: () => void;
  isLight: boolean;
  ink: string;
  muted: string;
}) {
  const chatMessages = chatThread?.messages ?? [];
  const chatPreview = chatMessages.slice(-6);
  return (
    <>
      <Section title="Chat" muted={muted}>
        <div className="flex items-start gap-2.5">
          <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF6B35]" />
          <div className="min-w-0 flex-1">
            {chatThread ? (
              <>
                <p className={cn("text-[13px] font-semibold", ink)}>
                  {chatMessages.length} message
                  {chatMessages.length === 1 ? "" : "s"}
                </p>
                <p className={cn("mt-0.5 text-[11px] font-medium", muted)}>
                  History is readable · send is locked for closed jobs
                </p>
                {chatPreview.length > 0 && (
                  <ul className="mt-3 space-y-2 pt-2">
                    {chatPreview.map((m) => (
                      <li key={m.id} className="min-w-0">
                        <p className={cn("text-[10px] font-semibold", muted)}>
                          {m.sender === "motorist"
                            ? job.motoristName
                            : m.sender === "professional"
                              ? job.repairProName
                              : "System"}
                          {m.at ? ` · ${formatWhenShort(m.at)}` : ""}
                        </p>
                        <p
                          className={cn(
                            "mt-0.5 line-clamp-3 text-[12px] font-medium leading-snug",
                            ink,
                          )}
                        >
                          {m.text || (m.voiceUrl ? "Voice note" : "Attachment")}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={onOpenChat}
                  className={cn(
                    "mt-3 inline-flex items-center gap-1 border-0 bg-transparent p-0 text-[13px] font-semibold text-[#FF6B35]",
                  )}
                >
                  Open chat history
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <p className={cn("text-[13px] font-medium leading-snug", muted)}>
                No chat thread was opened for this job, or messages are not
                available on this device.
              </p>
            )}
          </div>
        </div>
      </Section>

      {(job.rating != null && job.rating > 0) || job.ratingNote?.trim() ? (
        <Section title="Customer rating" muted={muted}>
          {job.rating != null && job.rating > 0 && (
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={cn(
                    "h-4 w-4",
                    n <= Number(job.rating)
                      ? "fill-[#FF6B35] text-[#FF6B35]"
                      : isLight
                        ? "text-slate-400"
                        : "text-white/30",
                  )}
                  strokeWidth={1.75}
                />
              ))}
              <span className={cn("ml-1 text-[13px] font-semibold", ink)}>
                {job.rating}/5
              </span>
            </div>
          )}
          {job.ratingNote?.trim() && (
            <p className={cn("mt-2 text-[13px] font-medium leading-snug", ink)}>
              “{job.ratingNote.trim()}”
            </p>
          )}
        </Section>
      ) : null}
    </>
  );
}
