"use client";

/**
 * In-app voice:
 * 1) WebRTC + durable HTTP signaling + STUN/TURN
 * 2) Low-bandwidth audio: mono ~16kHz, Opus adaptive (silent)
 * 3) Phone dialer fallback only if peer never answers (not mid-ICE)
 * 4) Incoming call works on any screen + browser notification
 *
 * Implementation lives in ./in-app-call/*; this file keeps the public API.
 */

export type { CallTarget } from "./in-app-call/types";
export { openTelDialer } from "./in-app-call/helpers";
export { useInAppCall } from "./in-app-call/call-context";
export { InAppCallProvider } from "./in-app-call/provider";
export { CallButton } from "./in-app-call/call-button";
