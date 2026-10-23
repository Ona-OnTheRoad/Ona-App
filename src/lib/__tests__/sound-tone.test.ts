// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  areAppSoundsEnabled,
  setAppSoundsEnabled,
  SOUNDS_SETTINGS_KEY,
} from "../sound-tone";

describe("Sound Settings & Tone", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to sounds enabled when storage is empty", () => {
    expect(areAppSoundsEnabled()).toBe(true);
  });

  it("reads false when sounds are disabled", () => {
    localStorage.setItem(SOUNDS_SETTINGS_KEY, JSON.stringify({ soundsOn: false }));
    expect(areAppSoundsEnabled()).toBe(false);
  });

  it("sets sounds enabled and writes to localStorage", () => {
    setAppSoundsEnabled(false);
    expect(areAppSoundsEnabled()).toBe(false);

    setAppSoundsEnabled(true);
    expect(areAppSoundsEnabled()).toBe(true);
  });
});
