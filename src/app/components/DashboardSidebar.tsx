"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/* =========================
   TYPES
========================= */

type Role = "admin" | "teacher" | "student";

type SidebarProps = {
  role: Role;
};

type ItemProps = {
  href: string;
  label: string;
  active: boolean;
};

/* =========================
   SIDEBAR ITEM (⬅ FIX UTAMA)
========================= */

function SidebarItem({ href, label, active }: ItemProps) {
  return (
    <Link
      href={href}
      className={`block px-4 py-2 rounded transition ${
        active ? "bg-blue-600 text-white" : "text-slate-200 hover:bg-slate-800"
      }`}
    >
      {label}
    </Link>
  );
}

/* =========================
   MAIN SIDEBAR
========================= */

export default function DashboardSidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="w-64 border-r bg-gray-950 p-4 space-y-6">
      <div className="text-lg font-bold">Dashboard</div>

      {role === "admin" && (
        <nav className="space-y-1">
          <SidebarItem
            href="/dashboard/admin"
            label="Dashboard"
            active={isActive("/dashboard/admin")}
          />
          <SidebarItem
            href="/dashboard/admin/classes"
            label="Classes"
            active={isActive("/dashboard/admin/classes")}
          />
          <SidebarItem
            href="/dashboard/admin/subscriptions"
            label="Subscriptions"
            active={isActive("/dashboard/admin/subscriptions")}
          />
          <SidebarItem
            href="/dashboard/admin/finance"
            label="Finance"
            active={isActive("/dashboard/admin/finance")}
          />
          <SidebarItem
            href="/dashboard/admin/payments"
            label="Payments"
            active={isActive("/dashboard/admin/payments")}
          />
        </nav>
      )}

      {role === "teacher" && (
        <nav className="space-y-1">
          <SidebarItem
            href="/dashboard/teacher"
            label="Dashboard"
            active={isActive("/dashboard/teacher")}
          />
          <SidebarItem
            href="/dashboard/teacher/classes"
            label="My Classes"
            active={isActive("/dashboard/teacher/classes")}
          />
        </nav>
      )}

      {role === "student" && (
        <nav className="space-y-1">
          <SidebarItem
            href="/dashboard/student"
            label="Dashboard"
            active={isActive("/dashboard/student")}
          />
          <SidebarItem
            href="/dashboard/student/classes"
            label="My Classes"
            active={isActive("/dashboard/student/classes")}
          />
          <SidebarItem
            href="/dashboard/student/upgrade"
            label="Upgrade"
            active={isActive("/dashboard/student/upgrade")}
          />
        </nav>
      )}
    </aside>
  );
}
