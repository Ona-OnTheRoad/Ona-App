// @vitest-environment jsdom
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTypingChannel } from "@/components/messages/use-typing-channel";

const supabase = vi.hoisted(() => {
  const channelApi = {
    on: vi.fn(),
    subscribe: vi.fn(),
    send: vi.fn(),
  };
  channelApi.on.mockReturnValue(channelApi);
  channelApi.subscribe.mockReturnValue(channelApi);

  const sb = {
    channel: vi.fn(() => channelApi),
    removeChannel: vi.fn(async () => "ok"),
  };

  return { channelApi, sb, createBrowserSupabase: vi.fn(() => sb) };
});

vi.mock("@/lib/supabase/client", () => ({
  createBrowserSupabase: supabase.createBrowserSupabase,
}));

describe("useTypingChannel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabase.channelApi.on.mockReturnValue(supabase.channelApi);
    supabase.channelApi.subscribe.mockReturnValue(supabase.channelApi);
    supabase.createBrowserSupabase.mockReturnValue(supabase.sb);
  });

  afterEach(() => {
    cleanup();
  });

  it("subscribes to a stable om-typing:{conversationId} topic", () => {
    renderHook(() => useTypingChannel("conv-1", "user-a", false));

    expect(supabase.sb.channel).toHaveBeenCalledTimes(1);
    expect(supabase.sb.channel).toHaveBeenCalledWith("om-typing:conv-1", {
      config: { broadcast: { self: false } },
    });
    expect(supabase.channelApi.on).toHaveBeenCalledWith(
      "broadcast",
      { event: "typing" },
      expect.any(Function),
    );
    expect(supabase.channelApi.subscribe).toHaveBeenCalled();
  });

  it("does not subscribe for closed chat, local chat-* ids, or missing user", () => {
    const { rerender } = renderHook(
      ({ id, userId, closed }) => useTypingChannel(id, userId, closed),
      { initialProps: { id: "conv-1", userId: "user-a" as string | null, closed: true } },
    );
    expect(supabase.sb.channel).not.toHaveBeenCalled();

    rerender({ id: "chat-local-1", userId: "user-a", closed: false });
    expect(supabase.sb.channel).not.toHaveBeenCalled();

    rerender({ id: "conv-1", userId: null, closed: false });
    expect(supabase.sb.channel).not.toHaveBeenCalled();
  });
});
