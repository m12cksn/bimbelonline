"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const dashboardHomePaths = new Set([
  "/dashboard",
  "/dashboard/student",
  "/dashboard/teacher",
  "/dashboard/admin",
]);

export default function GlobalDashboardLink() {
  const pathname = usePathname();
  const isAppPage =
    pathname.startsWith("/dashboard/") ||
    pathname.startsWith("/materials") ||
    pathname.startsWith("/coding");

  if (!isAppPage || dashboardHomePaths.has(pathname)) return null;

  return (
    <Link
      href="/dashboard"
      className="fixed bottom-4 left-4 z-40 inline-flex items-center gap-2 rounded-md border border-emerald-300 bg-white/95 px-4 py-2.5 text-sm font-bold text-emerald-700 shadow-lg backdrop-blur transition hover:border-emerald-500 hover:bg-emerald-50"
      aria-label="Kembali ke dashboard"
    >
      <span aria-hidden>←</span>
      Kembali ke Dashboard
    </Link>
  );
}
