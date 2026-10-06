"use client";

import { useCallback, useState } from "react";

export function useCopyField() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyField = useCallback(async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  }, []);

  return { copied, copyField };
}
