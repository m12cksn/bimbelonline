"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import DashboardSidebar from "./DashboardSidebar";

type Role = "admin" | "teacher" | "student";

type DashboardShellProps = {
  name: string;
  role: Role;
  children: ReactNode;
};

export default function DashboardShell({
  name,
  role,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Default: desktop sidebar open, mobile close
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024; // lg
      setSidebarOpen(isDesktop);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const IconMenu = () => (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );

  const IconUser = () => (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20a8 8 0 0116 0" />
    </svg>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-emerald-50 via-slate-100 to-white text-slate-900">
      {/* Background decoration mirip quiz */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-12 top-10 h-64 w-64 rounded-full bg-emerald-400/25 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-3xl border border-emerald-200/70" />
      </div>

      {/* Overlay hanya saat mobile & sidebar terbuka */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-200/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <div className="mx-auto flex min-h-screen w-full max-w-7xl">
        {/* Sidebar */}
        <DashboardSidebar
          role={role}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main area */}
        <div className="flex min-h-screen flex-1 flex-col">
          {/* Top bar */}
          <header className="sticky top-0 z-20 border-b border-emerald-200 bg-white/80 backdrop-blur">
            <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 lg:px-8">
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                {/* Toggle sidebar */}
                <button
                  type="button"
                  onClick={() => {
                    if (window.innerWidth < 1024) setSidebarOpen(true);
                  }}
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-300 px-4 text-sm font-semibold text-emerald-900 shadow-lg shadow-emerald-200/60 transition hover:border-emerald-400 hover:bg-emerald-200 lg:h-12 lg:px-5 lg:text-base"
                >
                  <IconMenu />
                </button>

                <div className="min-w-0 rounded-2xl border border-emerald-200 bg-linear-to-br from-emerald-100 via-emerald-50 to-white px-4 py-2 shadow-inner">
                  <p className="uppercase text-emerald-800 font font-semibold">
                    Dashboard
                  </p>
                  <p className="text-sm font-semibold text-slate-500 sm:whitespace-nowrap">
                    Belajar seru setiap hari
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-right">
                <div className="min-w-0 text-xs leading-tight">
                  <div className="font-semibold text-xl text-slate-900">
                    {name}
                  </div>
                  <div className="text-lg text-emerald-700 capitalize">
                    {role}
                  </div>
                </div>
                <LogoutButton />
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-100 text-base text-emerald-700">
                  <IconUser />
                </div>
              </div>
            </div>
          </header>

          {/* Content wrapper */}
          <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
            <div className="min-w-0 rounded-3xl bg-white p-4 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.25)] sm:p-6">
              {children}
            </div>
            <footer className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
              <span>(c) MathKids</span>
              <span className="text-slate-400">-</span>
              <Link href="/privacy" className="hover:text-emerald-700">
                Kebijakan Privasi
              </Link>
              <span className="text-slate-400">-</span>
              <Link href="/terms" className="hover:text-emerald-700">
                Syarat & Ketentuan
              </Link>
              <span className="text-slate-400">-</span>
              <Link href="/support" className="hover:text-emerald-700">
                Support
              </Link>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
