"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

type Role = "admin" | "teacher" | "student";

type SidebarProps = {
  role: Role;
  isOpen: boolean;
  onClose?: () => void;
};

type ItemProps = {
  href: string;
  label: string;
  description?: string;
  active: boolean;
  icon?: ReactNode;
  onClick?: () => void;
};

const navItems: Record<Role, Array<Omit<ItemProps, "active">>> = {
  admin: [
    {
      href: "/dashboard/admin",
      label: "Dashboard",
      description: "Ikhtisar sekolah",
      icon: <span aria-hidden>📊</span>,
    },
    {
      href: "/dashboard/admin/classes",
      label: "Classes",
      description: "Kelola jadwal & mapel",
      icon: <span aria-hidden>📘</span>,
    },
    {
      href: "/dashboard/admin/subscriptions",
      label: "Subscriptions",
      description: "Keanggotaan pengguna",
      icon: <span aria-hidden>💠</span>,
    },
    {
      href: "/dashboard/admin/finance",
      label: "Finance",
      description: "Pendapatan & biaya",
      icon: <span aria-hidden>💰</span>,
    },
    {
      href: "/dashboard/admin/payments",
      label: "Payments",
      description: "Transaksi terakhir",
      icon: <span aria-hidden>💳</span>,
    },
  ],
  teacher: [
    {
      href: "/dashboard/teacher",
      label: "Dashboard",
      description: "Ringkasan kelas",
      icon: <span aria-hidden>📊</span>,
    },
    {
      href: "/dashboard/teacher/classes",
      label: "My Classes",
      description: "Perbarui materi",
      icon: <span aria-hidden>🧑‍🏫</span>,
    },
  ],
  student: [
    {
      href: "/dashboard/student",
      label: "Dashboard",
      description: "Agenda hari ini",
      icon: <span aria-hidden>📅</span>,
    },
    {
      href: "/dashboard/student/classes",
      label: "My Classes",
      description: "Lihat jadwal",
      icon: <span aria-hidden>📘</span>,
    },
    {
      href: "/dashboard/student/upgrade",
      label: "Upgrade",
      description: "Paket premium",
      icon: <span aria-hidden>🚀</span>,
    },
  ],
};

function SidebarItem({
  href,
  label,
  description,
  active,
  icon,
  onClick,
}: ItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group relative block rounded-2xl border px-4 py-3 text-sm transition duration-200 ease-out ${
        active
          ? "border-cyan-400/70 bg-slate-900 text-slate-50 shadow-[0_12px_40px_-24px_rgba(15,23,42,1)]"
          : "border-slate-800 bg-slate-950/60 text-slate-200 hover:border-cyan-400/50 hover:bg-slate-900/80"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${
            active
              ? "bg-cyan-500/20 text-cyan-200"
              : "bg-slate-800 text-slate-200"
          }`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <div className="font-semibold tracking-tight">{label}</div>
          {description ? (
            <p className="text-xs text-slate-400">{description}</p>
          ) : null}
        </div>
        <span
          className={`h-2 w-2 rounded-full transition ${
            active ? "bg-cyan-300" : "bg-slate-600 group-hover:bg-cyan-300"
          }`}
        />
      </div>
    </Link>
  );
}

export default function DashboardSidebar({
  role,
  isOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-72 transform bg-slate-950/90 backdrop-blur-md transition-transform duration-300 ease-out border-r border-slate-800 ${
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      } lg:static lg:shadow-none`}
    >
      <div className="flex h-full flex-col gap-6 px-5 py-6">
        {/* Header sidebar */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">
              Navigation
            </p>
            <p className="text-base font-semibold text-slate-50">
              {role} panel
            </p>
          </div>
          <button
            type="button"
            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-200 transition hover:border-cyan-400/50 hover:text-cyan-100"
            onClick={() => {
              if (window.innerWidth < 1024) onClose?.();
            }}
            aria-label="Tutup sidebar"
          >
            ✕
          </button>
        </div>

        {/* Menu */}
        <nav className="space-y-3">
          {navItems[role].map((item) => (
            <SidebarItem
              key={item.href}
              {...item}
              active={isActive(item.href)}
              onClick={() => {
                if (window.innerWidth < 1024) onClose?.();
              }}
            />
          ))}
        </nav>

        {/* Tips box */}
        <div className="mt-auto rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-200 shadow-inner">
          <p className="font-semibold text-slate-50">Tips</p>
          <p className="text-xs text-slate-400">
            Gunakan tombol di kiri atas untuk menyembunyikan sidebar dan fokus
            pada konten.
          </p>
        </div>
      </div>
    </aside>
  );
}
