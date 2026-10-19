import type { ReactElement } from "react";
import { MessageSquare, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  isSwipeTrip: boolean;
  chatClosedForever: boolean;
  onCall: () => void;
  onMessage: () => void;
}

/** Call (outlined) + Message (coral) buttons. Handlers are supplied by the caller. */
export function TripCallMessageRow({
  isSwipeTrip,
  chatClosedForever,
  onCall,
  onMessage,
}: Props): ReactElement {
  return (
    <div
      className={cn("grid grid-cols-2 gap-3", isSwipeTrip ? "pt-2" : "pt-1")}
    >
      <Button variant="onaOutline" size="ona" onClick={onCall}>
        <Phone className="h-4 w-4" aria-hidden />
        Call
      </Button>
      <Button
        variant={chatClosedForever ? "onaDark" : "ona"}
        size="ona"
        onClick={onMessage}
      >
        <MessageSquare className="h-4 w-4" aria-hidden />
        {chatClosedForever ? "View chat" : "Message"}
      </Button>
    </div>
  );
}
