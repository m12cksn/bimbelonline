"use client";

import { useEffect } from "react";

type Props = {
  targetId: string;
};

export default function ScrollToFreeStart({ targetId }: Props) {
  useEffect(() => {
    const el = document.getElementById(targetId) as HTMLElement | null;
    if (!el) return;
    const handle = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      if (typeof el.focus === "function") {
        el.focus({ preventScroll: true });
      }
    }, 200);
    return () => window.clearTimeout(handle);
  }, [targetId]);

  return null;
}
