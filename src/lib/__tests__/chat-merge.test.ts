import { describe, expect, it } from "vitest";
import { mergeServerThreads, threadMatchesId } from "@/lib/chat-merge";
import type { ChatMessage, MessageThread } from "@/lib/types";

const msg = (id: string, status?: ChatMessage["status"]): ChatMessage => ({
  id,
  sender: "motorist",
  text: id,
  at: "2026-11-27T10:00:00.000Z",
  status,
});

const thread = (id: string, messages: ChatMessage[], requestId?: string): MessageThread => ({
  id,
  requestId,
  technicianId: "pro-1",
  technicianName: "Pro",
  motoristName: "Customer",
  serviceType: "mechanic",
  lastMessage: "",
  time: "",
  unread: 0,
  photo: "",
  messages,
});

describe("mergeServerThreads", () => {
  it("keeps a failed message when the server copy arrives without it", () => {
    const prev = [thread("c1", [msg("old"), msg("voice", "failed")])];
    const next = [thread("c1", [msg("old")])];
    expect(mergeServerThreads(prev, next)[0].messages.map((m) => m.id)).toEqual([
      "old",
      "voice",
    ]);
  });

  it("keeps a message that is still sending", () => {
    const merged = mergeServerThreads(
      [thread("c1", [msg("new", "sending")])],
      [thread("c1", [])],
    );
    expect(merged[0].messages.map((m) => m.id)).toEqual(["new"]);
  });

  it("matches a local chat-<request> thread to its server thread by request id", () => {
    const merged = mergeServerThreads(
      [thread("chat-r1", [msg("new", "failed")], "r1")],
      [thread("uuid-1", [], "r1")],
    );
    expect(merged[0].id).toBe("uuid-1");
    expect(merged[0].messages.map((m) => m.id)).toEqual(["new"]);
  });

  it("drops delivered messages (no status) so they are not duplicated", () => {
    const merged = mergeServerThreads(
      [thread("c1", [msg("sent")])],
      [thread("c1", [msg("server-copy")])],
    );
    expect(merged[0].messages.map((m) => m.id)).toEqual(["server-copy"]);
  });
});

describe("threadMatchesId", () => {
  it("accepts the conversation id, chat-<request> and the request id", () => {
    const t = thread("uuid-1", [], "r1");
    expect(threadMatchesId(t, "uuid-1")).toBe(true);
    expect(threadMatchesId(t, "chat-r1")).toBe(true);
    expect(threadMatchesId(t, "r1")).toBe(true);
    expect(threadMatchesId(t, "other")).toBe(false);
  });
});
