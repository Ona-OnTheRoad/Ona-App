"use client";

import { createContext, useContext } from "react";
import { openTelDialer } from "./helpers";
import type { CallContextValue } from "./types";

export const CallContext = createContext<CallContextValue | null>(null);

export function useInAppCall(): CallContextValue {
  const ctx = useContext(CallContext);
  if (!ctx) {
    return {
      startCall: (t) => {
        if (t.phone) openTelDialer(t.phone);
      },
      endCall: () => {},
      active: false,
    };
  }
  return ctx;
}
