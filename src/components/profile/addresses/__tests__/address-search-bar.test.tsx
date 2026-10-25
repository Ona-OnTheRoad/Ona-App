// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { AddressSearchBar } from "../address-search-bar";

describe("AddressSearchBar component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders input and locates button", () => {
    render(
      <AddressSearchBar
        value=""
        onChange={() => {}}
        onLocate={() => {}}
        onSelectPlace={() => {}}
      />,
    );

    expect(screen.getByPlaceholderText("Search address or area...")).toBeDefined();
  });

  it("sequence guards suggestions so slow older requests do not overwrite newer ones", async () => {
    let resolveFirst: (val: unknown) => void = () => {};
    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });

    vi.spyOn(global, "fetch").mockImplementation((url) => {
      if (String(url).includes("first")) {
        return firstPromise as Promise<Response>;
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          results: [
            {
              id: "server-2",
              primary: "Newer Place",
              secondary: "Lagos, Nigeria",
              lat: 6.5,
              lng: 3.4,
            },
          ],
        }),
      } as Response);
    });

    render(
      <AddressSearchBar
        value=""
        onChange={() => {}}
        onLocate={() => {}}
        onSelectPlace={() => {}}
      />,
    );

    const input = screen.getByPlaceholderText("Search address or area...");

    // 1. First query: "first"
    fireEvent.change(input, { target: { value: "first" } });

    // Advance 100ms
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // 2. Second query: "second"
    fireEvent.change(input, { target: { value: "second" } });

    // Advance debounce (350ms)
    act(() => {
      vi.advanceTimersByTime(400);
    });

    // Flush fetch microtasks
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    // The newer place is displayed
    expect(screen.getByText("Newer Place")).toBeDefined();

    // 3. Now the slow first request finally finishes
    await act(async () => {
      resolveFirst({
        ok: true,
        json: async () => ({
          results: [
            {
              id: "server-1",
              primary: "Old Stale Place",
              secondary: "Lagos, Nigeria",
              lat: 6.1,
              lng: 3.1,
            },
          ],
        }),
      });
      await Promise.resolve();
      await Promise.resolve();
    });

    // The stale older response must NOT overwrite the newer place
    expect(screen.queryByText("Old Stale Place")).toBeNull();
    expect(screen.getByText("Newer Place")).toBeDefined();
  });
});
