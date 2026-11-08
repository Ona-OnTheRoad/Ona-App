/**
 * When to ask a signed-in user to turn on notifications. Pure so it can be
 * tested; the browser-facing wrapper is the PushEnrollment component.
 */

export const PUSH_PROMPT_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
export const PUSH_PROMPT_SNOOZE_KEY = "ona-push-prompt-until";

export type PushPromptMode =
  /** Ask for permission (must be from a tap). */
  | "ask"
  /** Permission already granted: just re-sync the subscription quietly. */
  | "sync"
  /** Nothing to do (unsupported, blocked, turned off in Settings, snoozed). */
  | "none";

export function decidePushPrompt(input: {
  signedIn: boolean;
  /** Settings -> notifications "push" delivery switch. */
  deliveryAllowed: boolean;
  /** Service worker + PushManager + Notification all available. */
  pushSupported: boolean;
  permission: NotificationPermission | "unsupported";
  snoozedUntil: number;
  now: number;
}): PushPromptMode {
  if (!input.signedIn || !input.deliveryAllowed) return "none";
  // iPhone browser tabs have no Push API until the app is installed to the Home
  // Screen; the existing InstallNudge covers that case.
  if (!input.pushSupported) return "none";
  if (input.permission === "denied" || input.permission === "unsupported") {
    return "none";
  }
  if (input.permission === "granted") return "sync";
  return input.now >= input.snoozedUntil ? "ask" : "none";
}
