"use client";

import { useEffect, useState } from "react";

/** Resolves the #ona-phone portal mount (polls until it exists). */
export function useOnaPhoneMount(): HTMLElement | null {
  const [mount, setMount] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const resolve = () => {
      const el = document.getElementById("ona-phone");
      if (el) setMount(el);
      return el;
    };
    if (resolve()) return;
    const t = window.setInterval(() => {
      if (resolve()) window.clearInterval(t);
    }, 50);
    return () => window.clearInterval(t);
  }, []);

  return mount;
}
