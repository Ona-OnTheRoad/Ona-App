import { createPortal } from "react-dom";
import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarInitials } from "@/lib/brand";
import { cn } from "@/lib/utils";
import type {
  CallMode,
  CallPhase,
  CallTarget,
  IncomingCall,
} from "./types";

type CallSheetProps = {
  mount: HTMLElement;
  isLight: boolean;
  phase: CallPhase;
  mode: CallMode;
  target: CallTarget;
  incoming: IncomingCall | null;
  phaseLabel: string;
  statusHint: string;
  muted: boolean;
  speaker: boolean;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onEnd: () => void;
  onAccept: () => void;
  onReject: () => void;
  onCallPhone: (target: CallTarget) => void;
};

/** Full-screen call overlay, portaled inside #ona-phone. */
export function CallSheet({
  mount,
  isLight,
  phase,
  mode,
  target,
  incoming,
  phaseLabel,
  statusHint,
  muted,
  speaker,
  onToggleMute,
  onToggleSpeaker,
  onEnd,
  onAccept,
  onReject,
  onCallPhone,
}: CallSheetProps) {
  return createPortal(
    <div
      className={cn(
        "absolute inset-0 z-200 flex flex-col",
        isLight ? "bg-[#0a1610]" : "bg-[#0a0000]",
      )}
      role="dialog"
      aria-modal
      aria-label="In-app call"
    >
      <div className="flex flex-1 flex-col items-center justify-center px-6 pt-10">
        <div className="relative mb-6">
          {(phase === "dialing" ||
            phase === "ringing" ||
            phase === "connecting") && (
            <>
              <span className="om-call-ring absolute -inset-2.5 rounded-full" />
              <span className="om-call-ring om-call-ring-delay absolute -inset-2.5 rounded-full" />
            </>
          )}
          <Avatar className="relative h-24 w-24 overflow-hidden rounded-full ring-2 ring-brand/50">
            {target.photo?.trim() ? (
              <AvatarImage
                src={target.photo.trim()}
                alt={target.name}
                className="object-cover"
              />
            ) : null}
            <AvatarFallback className="bg-brand text-2xl font-bold text-white">
              {avatarInitials(target.name)}
            </AvatarFallback>
          </Avatar>
        </div>
        <p className="text-center text-[20px] font-black text-white">
          {target.name}
        </p>
        {target.roleLabel && (
          <p className="mt-0.5 text-[12px] font-semibold text-white/55">
            {target.roleLabel}
          </p>
        )}
        <p className="mt-3 text-[14px] font-bold tabular-nums text-brand">
          {phaseLabel}
        </p>
        {mode === "webrtc" && (
          <p className="mt-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
            In-app voice
          </p>
        )}
        {mode === "phone" && (
          <p className="mt-1 rounded-full bg-sky-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-300">
            Phone line
          </p>
        )}
        {statusHint && (
          <p className="mt-3 max-w-70 text-center text-[11px] leading-snug text-white/55">
            {statusHint}
          </p>
        )}

        {phase === "ringing" && incoming && (
          <div className="mt-8 flex w-full max-w-70 gap-3">
            <button
              type="button"
              onClick={onReject}
              className="flex h-12 flex-1 items-center justify-center rounded-md border-0 bg-red-500 text-[13px] font-bold text-white"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={onAccept}
              className="flex h-12 flex-1 items-center justify-center rounded-md border-0 bg-emerald-500 text-[13px] font-bold text-white"
            >
              Accept
            </button>
          </div>
        )}

        {mode === "webrtc" &&
          phase !== "connected" &&
          phase !== "ringing" &&
          (target.phone || "").replace(/[^\d+]/g, "") && (
            <button
              type="button"
              onClick={() => onCallPhone(target)}
              className="mt-5 rounded-md border-0 bg-[#FF6B35] px-4 py-2.5 text-[12px] font-bold text-white"
            >
              Call on phone line now
            </button>
          )}
      </div>

      {!(phase === "ringing" && incoming) && (
        <div className="flex items-center justify-center gap-6 px-8 pb-10">
          <button
            type="button"
            onClick={onToggleMute}
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full border-0",
              muted ? "bg-white/20 text-white" : "bg-white/10 text-white",
            )}
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </button>
          <button
            type="button"
            onClick={onEnd}
            className="flex h-16 w-16 items-center justify-center rounded-full border-0 bg-red-500 text-white"
            aria-label="End call"
          >
            <PhoneOff className="h-7 w-7" />
          </button>
          <button
            type="button"
            onClick={onToggleSpeaker}
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full border-0",
              speaker ? "bg-white/20 text-white" : "bg-white/10 text-white",
            )}
            aria-label="Speaker"
          >
            {speaker ? (
              <Volume2 className="h-5 w-5" />
            ) : (
              <VolumeX className="h-5 w-5" />
            )}
          </button>
        </div>
      )}
    </div>,
    mount,
  );
}
