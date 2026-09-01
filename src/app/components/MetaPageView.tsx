"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackMetaEvent } from "@/lib/meta-pixel";

export default function MetaPageView() {
  const pathname = usePathname();

  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    // Hindari event ganda untuk pathname yang sama.
    // Berguna juga saat React Strict Mode melakukan effect ulang di development.
    if (lastTrackedPath.current === pathname) {
      return;
    }

    lastTrackedPath.current = pathname;

    trackMetaEvent("PageView");
  }, [pathname]);

  return null;
}
