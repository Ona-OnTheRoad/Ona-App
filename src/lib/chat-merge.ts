import type { MessageThread } from "@/lib/types";

/** True when `threadId` (a conversation id, "chat-<request>" or a request id) addresses `t`. */
export function threadMatchesId(t: MessageThread, threadId: string): boolean {
  return (
    t.id === threadId ||
    Boolean(
      t.requestId &&
        (threadId === `chat-${t.requestId}` || threadId === t.requestId),
    )
  );
}

/**
 * Replace local threads with a fresh server copy, but keep messages that have
 * not reached the server yet ("sending") or did not make it ("failed").
 * Without this, every refresh erased an unsent message from the sender's screen.
 */
export function mergeServerThreads(
  prev: MessageThread[],
  next: MessageThread[],
): MessageThread[] {
  return next.map((n) => {
    const pending = prev
      .filter(
        (p) => p.id === n.id || (p.requestId && p.requestId === n.requestId),
      )
      .flatMap((p) => p.messages.filter((m) => m.status));
    if (!pending.length) return n;
    const seen = new Set<string>();
    const unique = pending.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
    return { ...n, messages: [...n.messages, ...unique] };
  });
}
