"use client";

import { ReactNode, useEffect, useState } from "react";
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-900 via-slate-950 to-indigo-950 text-slate-50">
      {/* Background decoration mirip quiz */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-12 top-10 h-64 w-64 rounded-full bg-cyan-500/25 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-pink-500/25 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-3xl border border-slate-700/60" />
      </div>

      {/* Overlay hanya saat mobile & sidebar terbuka */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <div className="mx-auto flex min-h-screen max-w-7xl">
        {/* Sidebar */}
        <DashboardSidebar
          role={role}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main area */}
        <div className="flex min-h-screen flex-1 flex-col">
          {/* Top bar */}
          <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
            <div className="flex items-center justify-between px-5 py-4 lg:px-8">
              <div className="flex items-center gap-3">
                {/* Toggle sidebar */}
                <button
                  type="button"
                  onClick={() => {
                    if (window.innerWidth < 1024) setSidebarOpen(true);
                  }}
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/80 px-4 text-sm font-semibold text-slate-50 shadow-lg shadow-black/40 transition hover:border-cyan-400/60 hover:text-cyan-100 lg:h-12 lg:px-5 lg:text-base"
                >
                  <span className="text-lg">☰</span>
                </button>

                <div className="rounded-2xl border border-white/10 bg-linear-to-r from-sky-500/20 via-purple-500/20 to-pink-500/20 px-4 py-2 shadow-inner">
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">
                    Dashboard
                  </p>
                  <p className="text-sm font-semibold text-slate-50">
                    Belajar seru setiap hari
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-right">
                <div className="text-xs leading-tight">
                  <div className="font-semibold text-slate-50">{name}</div>
                  <div className="text-[11px] text-cyan-300 capitalize">
                    {role}
                  </div>
                </div>
                <LogoutButton />
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-base">
                  😊
                </div>
              </div>
            </div>
          </header>

          {/* Content wrapper mirip card quiz (gelap, ada border) */}
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4 shadow-[0_20px_60px_-35px_rgba(0,0,0,1)] sm:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
