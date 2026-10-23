// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from "vitest";
import {
  getAndClearReturnTo,
  resolvePostLoginDestination,
  RETURN_TO_STORAGE_KEY,
  sanitizeReturnTo,
  saveReturnTo,
} from "../auth-return-to";

describe("sanitizeReturnTo", () => {
  it("allows safe internal paths", () => {
    expect(sanitizeReturnTo("/jobs/job-123")).toBe("/jobs/job-123");
    expect(sanitizeReturnTo("/profile?tab=security")).toBe("/profile?tab=security");
    expect(sanitizeReturnTo("/messages/conv-1")).toBe("/messages/conv-1");
  });

  it("rejects open redirect attacks and non-relative URLs", () => {
    expect(sanitizeReturnTo("https://evil.com")).toBeNull();
    expect(sanitizeReturnTo("http://evil.com/jobs")).toBeNull();
    expect(sanitizeReturnTo("//evil.com")).toBeNull();
    expect(sanitizeReturnTo("/\\evil.com")).toBeNull();
    expect(sanitizeReturnTo("javascript:alert(1)")).toBeNull();
    expect(sanitizeReturnTo("data:text/html,evil")).toBeNull();
    expect(sanitizeReturnTo("evil.com")).toBeNull();
    expect(sanitizeReturnTo("")).toBeNull();
    expect(sanitizeReturnTo(null)).toBeNull();
  });

  it("rejects auth loops to public pages", () => {
    expect(sanitizeReturnTo("/login")).toBeNull();
    expect(sanitizeReturnTo("/login/signin")).toBeNull();
    expect(sanitizeReturnTo("/signup")).toBeNull();
    expect(sanitizeReturnTo("/logout")).toBeNull();
  });

  it("checks role permissions when accountType is provided", () => {
    // Motorist cannot access pro-only routes
    expect(sanitizeReturnTo("/dashboard", "motorist")).toBeNull();
    expect(sanitizeReturnTo("/jobs/job-123", "motorist")).toBe("/jobs/job-123");

    // Pro can access dashboard
    expect(sanitizeReturnTo("/dashboard", "professional")).toBe("/dashboard");
  });
});

describe("saveReturnTo and getAndClearReturnTo", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("saves and retrieves returnTo from sessionStorage", () => {
    saveReturnTo("/jobs/job-456");
    expect(sessionStorage.getItem(RETURN_TO_STORAGE_KEY)).toBe("/jobs/job-456");

    const retrieved = getAndClearReturnTo("motorist");
    expect(retrieved).toBe("/jobs/job-456");
    expect(sessionStorage.getItem(RETURN_TO_STORAGE_KEY)).toBeNull();
  });

  it("prefers explicit search parameter over sessionStorage", () => {
    saveReturnTo("/old-path");
    const retrieved = getAndClearReturnTo("motorist", "/profile");
    expect(retrieved).toBe("/profile");
    expect(sessionStorage.getItem(RETURN_TO_STORAGE_KEY)).toBeNull();
  });
});

describe("resolvePostLoginDestination", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("falls back to default home path when no returnTo is stored", () => {
    expect(resolvePostLoginDestination("motorist")).toBe("/");
    expect(resolvePostLoginDestination("professional")).toBe("/dashboard");
  });

  it("resolves valid return path when present", () => {
    saveReturnTo("/messages/conv-1");
    expect(resolvePostLoginDestination("motorist")).toBe("/messages/conv-1");
  });

  it("falls back to default home if returnTo is disallowed for role", () => {
    saveReturnTo("/dashboard");
    expect(resolvePostLoginDestination("motorist")).toBe("/");
  });
});
