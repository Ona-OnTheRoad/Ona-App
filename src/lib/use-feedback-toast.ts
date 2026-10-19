"use client";

import { useEffect } from "react";
import { toastError, toastSuccess } from "@/lib/toast";

/**
 * Show a form's `error` / `info` strings as toasts when they appear.
 * Clearing the string (as submit handlers do first) re-arms the same message.
 */
export function useFeedbackToast(info: string, error: string) {
  useEffect(() => {
    if (error) toastError(error);
  }, [error]);
  useEffect(() => {
    if (info) toastSuccess(info);
  }, [info]);
}
