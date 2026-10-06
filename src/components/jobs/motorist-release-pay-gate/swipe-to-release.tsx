import { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SwipeToRelease({
  onRelease,
  busy,
  isLight,
}: {
  onRelease: () => void;
  busy: boolean;
  isLight?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const released = useRef(false);
  const wasBusy = useRef(false);

  // Re-arm after a failed release (busy → idle while still on this screen).
  // Success navigates/unmounts; failure must allow another swipe.
  useEffect(() => {
    if (wasBusy.current && !busy && released.current) {
      released.current = false;
      setProgress(0);
      setDragging(false);
    }
    wasBusy.current = busy;
  }, [busy]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (busy || released.current) return;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setProgress(x / rect.width);
  };

  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    if (progress >= 0.85 && !released.current) {
      released.current = true;
      setProgress(1);
      onRelease();
    } else {
      setProgress(0);
    }
  };

  return (
    <div
      ref={trackRef}
      className="relative mt-5 h-14 w-full select-none overflow-hidden rounded-full border-0 bg-[#FF6B35]/20"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ touchAction: "none" }}
    >
      {/* Background text */}
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center text-[12px] font-bold tracking-wide",
          isLight ? "text-slate-600" : "text-zinc-300",
        )}
      >
        {busy ? "Confirming…" : "I am Satisfied Release Payment"}
      </span>

      {/* Slider knob */}
      <div
        className="absolute inset-y-1 flex items-center justify-center rounded-full bg-[#FF6B35] text-white shadow-lg transition-shadow active:shadow-xl"
        style={{
          left: 4,
          width: `${Math.max(progress * 100, busy ? 100 : 14)}%`,
          minWidth: 56,
        }}
      >
        <ChevronRight className="h-5 w-5" strokeWidth={3} />
      </div>
    </div>
  );
}
