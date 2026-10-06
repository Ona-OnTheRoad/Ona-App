import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

interface Props {
  isSwipeTrip: boolean;
  chatClosedForever: boolean;
  onCall: () => void;
  onMessage: () => void;
}

/**
 * Icon-only Call / Message elite Swiss-minimal line marks.
 * Flat solid buttons, no labels / glow / gradient / shadow on icons.
 */
export function TripCallMessageRow({
  isSwipeTrip,
  chatClosedForever,
  onCall,
  onMessage,
}: Props): ReactElement {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2.5",
        isSwipeTrip ? "mt-8 pt-2" : "pt-1",
      )}
    >
      <button
        type="button"
        onClick={onCall}
        aria-label="Call"
        className="inline-flex h-12 w-full items-center justify-center rounded-lg border-0 bg-[#E8E8E8] shadow-none"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-[22px] w-[22px]"
          fill="none"
          aria-hidden
        >
          {/* Classic phone handset instantly readable call mark */}
          <path
            d="M8.05 3.5c.4-.4 1-.5 1.5-.3l2.2 1c.5.2.8.7.7 1.2l-.4 2.1c-.1.4-.3.7-.7.9l-1.3.6c1.2 2.4 3.1 4.3 5.5 5.5l.6-1.3c.2-.4.5-.6.9-.7l2.1-.4c.5-.1 1 .2 1.2.7l1 2.2c.2.5.1 1.1-.3 1.5l-1.2 1.2c-.5.5-1.2.7-1.9.6-4.8-.7-8.8-4.7-9.5-9.5-.1-.7.1-1.4.6-1.9L8.05 3.5Z"
            stroke="#111111"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          {/* Gold accent short detail on earpiece */}
          <path
            d="M9.4 5.6l1.4.6"
            stroke="#FF6B35"
            strokeWidth="1.45"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <button
        type="button"
        onClick={onMessage}
        aria-label={chatClosedForever ? "View chat" : "Message"}
        className={cn(
          "inline-flex h-12 w-full items-center justify-center rounded-lg border-0 shadow-none",
          chatClosedForever ? "bg-[#3a3a3c]" : "bg-[#FF6B35]",
        )}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-[22px] w-[22px]"
          fill="none"
          aria-hidden
        >
          {/* Speech bubble + elegant tail */}
          <path
            d="M5.5 5.8A1.8 1.8 0 0 1 7.3 4h9.4a1.8 1.8 0 0 1 1.8 1.8v7.2a1.8 1.8 0 0 1-1.8 1.8h-4.1L8.2 18.2v-3.4H7.3a1.8 1.8 0 0 1-1.8-1.8V5.8Z"
            stroke="#111111"
            strokeWidth="1.55"
            strokeLinejoin="round"
          />
          {/* Text lines two black, one gold accent */}
          <path
            d="M8.4 7.6h7.2"
            stroke="#111111"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M8.4 10h5.6"
            stroke="#FF6B35"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M8.4 12.4h4"
            stroke="#111111"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
