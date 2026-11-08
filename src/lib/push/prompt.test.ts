import { describe, expect, it } from "vitest";
import { decidePushPrompt, PUSH_PROMPT_SNOOZE_MS } from "./prompt";

const base = {
  signedIn: true,
  deliveryAllowed: true,
  pushSupported: true,
  permission: "default" as NotificationPermission | "unsupported",
  snoozedUntil: 0,
  now: 1_000_000,
};

describe("decidePushPrompt", () => {
  it("asks a signed-in customer or pro who has not decided yet", () => {
    expect(decidePushPrompt(base)).toBe("ask");
  });
  it("quietly re-syncs when permission was already granted, even if snoozed", () => {
    expect(decidePushPrompt({ ...base, permission: "granted", snoozedUntil: base.now + PUSH_PROMPT_SNOOZE_MS })).toBe("sync");
  });
  it("stays quiet when signed out, turned off in Settings, or blocked", () => {
    expect(decidePushPrompt({ ...base, signedIn: false })).toBe("none");
    expect(decidePushPrompt({ ...base, deliveryAllowed: false })).toBe("none");
    expect(decidePushPrompt({ ...base, permission: "denied" })).toBe("none");
  });
  it("does not nag again until the snooze has passed", () => {
    expect(decidePushPrompt({ ...base, snoozedUntil: base.now + 1 })).toBe("none");
    expect(decidePushPrompt({ ...base, snoozedUntil: base.now })).toBe("ask");
  });
  it("does nothing when the browser has no push support (e.g. an iPhone tab before install)", () => {
    expect(decidePushPrompt({ ...base, pushSupported: false, permission: "unsupported" })).toBe("none");
  });
});
