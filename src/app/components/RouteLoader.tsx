"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function isModifiedEvent(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function shouldIgnoreLink(anchor: HTMLAnchorElement) {
  if (anchor.target && anchor.target !== "_self") return true;
  if (anchor.hasAttribute("download")) return true;
  if (anchor.dataset.noLoader === "true") return true;
  return false;
}

function isSamePageLink(anchor: HTMLAnchorElement) {
  const href = anchor.getAttribute("href") || "";
  return href.startsWith("#");
}

export default function RouteLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<number | null>(null);
  const watchdogRef = useRef<number | null>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (isModifiedEvent(event)) return;
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (shouldIgnoreLink(anchor)) return;
      if (isSamePageLink(anchor)) return;
      if (anchor.href && typeof window !== "undefined") {
        const url = new URL(anchor.href, window.location.href);
        if (url.origin !== window.location.origin) return;
      }
      setLoading(true);
      if (watchdogRef.current) window.clearTimeout(watchdogRef.current);
      watchdogRef.current = window.setTimeout(() => {
        setLoading(false);
      }, 4000);
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  useEffect(() => {
    if (!loading) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setLoading(false);
    }, 350);
  }, [pathname, searchParams, loading]);

  if (!loading) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[9999]">
      <div className="relative h-1 w-full overflow-hidden bg-slate-200/60">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 shimmer" />
      </div>
      <div className="mx-auto mt-3 w-fit rounded-full border border-emerald-200 bg-white/90 px-4 py-2 text-[11px] font-semibold text-emerald-700 shadow-lg backdrop-blur">
        Sedang memuat...
      </div>
    </div>
  );
}
