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

const iconClass = "h-5 w-5";

const IconHome = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 11.5L12 4l9 7.5" />
    <path d="M6 10.5V20h12v-9.5" />
  </svg>
);

const IconBook = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 5h10a3 3 0 013 3v11H7a3 3 0 00-3 3V5z" />
    <path d="M17 19h3V7a3 3 0 00-3-3h-2" />
  </svg>
);

const IconUsers = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="9" cy="8" r="3" />
    <circle cx="17" cy="10" r="2.5" />
    <path d="M4 19a5 5 0 0110 0" />
    <path d="M14.5 19a4 4 0 017.5 0" />
  </svg>
);

const IconClipboard = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="6" y="5" width="12" height="16" rx="2" />
    <path d="M9 5.5a3 3 0 016 0" />
  </svg>
);

const IconChart = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 19V5" />
    <path d="M8 19v-7" />
    <path d="M12 19v-4" />
    <path d="M16 19v-9" />
    <path d="M20 19V8" />
  </svg>
);

const IconMoney = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconCredit = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <path d="M3 10h18" />
  </svg>
);

const IconCalendar = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 9h18" />
  </svg>
);

const IconCheck = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M5 13l4 4L19 7" />
  </svg>
);

const IconTarget = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="7" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconTrophy = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M7 4h10v4a5 5 0 01-10 0V4z" />
    <path d="M9 18h6M10 21h4" />
    <path d="M7 6H4a3 3 0 003 3" />
    <path d="M17 6h3a3 3 0 01-3 3" />
  </svg>
);

const IconUpgrade = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 3l5 6h-3v6H10V9H7l5-6z" />
    <path d="M5 21h14" />
  </svg>
);

const IconUser = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20a8 8 0 0116 0" />
  </svg>
);

const IconClose = () => (
  <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M6 6l12 12M18 6l-12 12" />
  </svg>
);

const navItems: Record<Role, Array<Omit<ItemProps, "active">>> = {
  admin: [
    {
      href: "/dashboard/admin",
      label: "Dashboard",
      description: "Ikhtisar sekolah",
      icon: <IconHome />,
    },
    {
      href: "/dashboard/admin/classes",
      label: "Classes",
      description: "Kelola jadwal & mapel",
      icon: <IconBook />,
    },
    {
      href: "/dashboard/admin/subscriptions",
      label: "Subscriptions",
      description: "Keanggotaan pengguna",
      icon: <IconCredit />,
    },
    {
      href: "/dashboard/admin/students",
      label: "Siswa",
      description: "Daftar & status paket",
      icon: <IconUsers />,
    },
    {
      href: "/dashboard/admin/coding-registrations",
      label: "Coding Registrations",
      description: "Pendaftar kelas coding",
      icon: <IconClipboard />,
    },
    {
      href: "/dashboard/admin/questions",
      label: "Soal",
      description: "Kelola soal bergambar",
      icon: <IconClipboard />,
    },
    {
      href: "/dashboard/admin/finance",
      label: "Finance",
      description: "Pendapatan & biaya",
      icon: <IconMoney />,
    },
    {
      href: "/dashboard/admin/payments",
      label: "Payments",
      description: "Transaksi terakhir",
      icon: <IconCredit />,
    },
  ],
  teacher: [
    {
      href: "/dashboard/teacher",
      label: "Dashboard",
      description: "Ringkasan kelas",
      icon: <IconHome />,
    },
    {
      href: "/dashboard/teacher/classes",
      label: "My Classes",
      description: "Perbarui materi",
      icon: <IconBook />,
    },
  ],
  student: [
    {
      href: "/dashboard/student",
      label: "Dashboard",
      description: "Agenda hari ini",
      icon: <IconHome />,
    },
    {
      href: "/materials",
      label: "Materi & Soal",
      description: "Pilih Materi yang ingin kamu kerjakan",
      icon: <IconBook />,
    },
    {
      href: "/dashboard/student/classes",
      label: "My Classes",
      description: "Lihat jadwal",
      icon: <IconUsers />,
    },
    {
      href: "/dashboard/student/schedule",
      label: "Jadwal",
      description: "Sesi Zoom terdekat",
      icon: <IconCalendar />,
    },
    {
      href: "/dashboard/student/attendance",
      label: "Kehadiran",
      description: "Riwayat absen",
      icon: <IconCheck />,
    },
    {
      href: "/dashboard/student/tryouts",
      label: "Tryout",
      description: "Riwayat tryout",
      icon: <IconTarget />,
    },
    {
      href: "/dashboard/student/statistics",
      label: "Statistik",
      description: "Progress belajar",
      icon: <IconChart />,
    },
    {
      href: "/dashboard/student/leaderboard",
      label: "Leaderboard",
      description: "Peringkat global",
      icon: <IconTrophy />,
    },
    {
      href: "/dashboard/student/upgrade",
      label: "Upgrade",
      description: "Paket premium",
      icon: <IconUpgrade />,
    },
    {
      href: "/dashboard/student/account",
      label: "Akun",
      description: "Profil & langganan",
      icon: <IconUser />,
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
      className={`group relative block rounded-2xl px-4 py-3 text-sm transition duration-200 ease-out ${
        active
          ? "bg-linear-to-br from-emerald-200 via-emerald-100 to-white text-slate-900 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.4)]"
          : "bg-white text-slate-700 shadow-md hover:border-emerald-300 hover:bg-emerald-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${
            active
              ? "bg-emerald-500 text-white"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <div className="font-semibold tracking-tight">{label}</div>
          {description ? (
            <p className="text-xs text-slate-500">{description}</p>
          ) : null}
        </div>
        <span
          className={`h-2 w-2 rounded-full transition ${
            active ? "bg-emerald-500" : "bg-slate-300 group-hover:bg-emerald-300"
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
      className={`fixed inset-y-0 left-0 z-40 w-72 transform bg-white backdrop-blur-md transition-transform duration-300 ease-out ${
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      } lg:static lg:shadow-none`}
    >
      <div className="flex h-full flex-col gap-6 px-5 py-6">
        {/* Header sidebar */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold uppercase text-emerald-900">
              Navigation
            </p>
            <p className="text-base font-semibold text-emerald-700">
              {role} panel
            </p>
          </div>
          <button
            type="button"
            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-200 text-emerald-900 transition hover:bg-emerald-300"
            onClick={() => {
              if (window.innerWidth < 1024) onClose?.();
            }}
            aria-label="Tutup sidebar"
          >
            <IconClose />
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
        <div className="mt-auto rounded-2xl border border-emerald-200 bg-linear-to-br from-emerald-100 via-emerald-50 to-white p-4 text-sm text-emerald-900 shadow-inner">
          <p className="mb-1 font-semibold text-emerald-900">Tips</p>
          <p className="text-xs text-emerald-800">
            Gunakan tombol di kiri atas untuk menyembunyikan sidebar dan fokus
            pada konten.
          </p>
        </div>
      </div>
    </aside>
  );
}
