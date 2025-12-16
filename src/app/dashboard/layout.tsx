// app/dashboard/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { UserRole } from "@/lib/type";
import LogoutButton from "@/app/components/LogoutButton";
import DashboardSidebar from "@/app/components/DashboardSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    redirect("/login");
  }

  const role = profile.role as UserRole;
  const name = profile.full_name ?? "Siswa";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-10 h-40 w-40 rounded-full bg-cyan-500/30 blur-3xl" />
        <div className="absolute top-40 -right-20 h-52 w-52 rounded-full bg-pink-500/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-40 w-40 -translate-x-1/2 rounded-3xl border border-purple-500/30" />
      </div>

      {/* Header */}
      <header className="w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-linear-to-tr from-cyan-400 via-purple-500 to-pink-500 text-xl shadow-lg">
              📚
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-tight text-white">
                Bimbel Kids Online
              </div>
              <div className="text-[10px] text-slate-300">
                Belajar seru setiap hari 🎯
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-right">
            <div className="text-xs leading-tight">
              <div className="font-semibold text-slate-100">{name}</div>
              <div className="text-[10px] text-cyan-300 capitalize">{role}</div>
            </div>
            <LogoutButton />
            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-sm border border-slate-600">
              🙂
            </div>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="mx-auto flex max-w-7xl">
        <DashboardSidebar role={role} />
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
