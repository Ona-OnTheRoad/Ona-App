import type { CallPhase, IncomingCall } from "./types";

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
  // Public TURN for NAT / mobile networks (best-effort free relay)
  {
    urls: [
      "turn:openrelay.metered.ca:80",
      "turn:openrelay.metered.ca:80?transport=tcp",
      "turn:openrelay.metered.ca:443",
      "turns:openrelay.metered.ca:443?transport=tcp",
      "turn:openrelay.metered.ca:443?transport=tcp",
    ],
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

export function openTelDialer(phone: string): boolean {
  const n = (phone || "").replace(/[^\d+]/g, "");
  if (!n) return false;
  try {
    const a = document.createElement("a");
    a.href = `tel:${n}`;
    a.style.cssText =
      "position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0";
    document.body.appendChild(a);
    a.click();
    window.requestAnimationFrame(() => a.remove());
    return true;
  } catch {
    return false;
  }
}

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function newCallId(): string {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function isUuid(s: string | undefined | null): boolean {
  if (!s) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s,
  );
}

/** Remote SDP must be used as-is only munge local offers/answers. */
export function asRemoteDesc(
  sdp: RTCSessionDescriptionInit,
): RTCSessionDescriptionInit {
  return { type: sdp.type, sdp: sdp.sdp };
}

export function getPhaseLabel(
  phase: CallPhase,
  incoming: IncomingCall | null,
  seconds: number,
): string {
  return phase === "dialing"
    ? "Calling…"
    : phase === "ringing" && incoming
      ? "Incoming call"
      : phase === "ringing"
        ? "Ringing…"
        : phase === "connecting"
          ? "Connecting…"
          : phase === "connected"
            ? formatDuration(seconds)
            : phase === "ended"
              ? "Call ended"
              : "";
}
