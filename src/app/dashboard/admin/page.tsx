// app/dashboard/admin/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // cek role di profiles
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    // kalau bukan admin, lempar ke dashboard student saja
    redirect("/dashboard/student");
  }

  return (
    <div className="space-y-4 text-slate-50">
      <h1 className="text-2xl font-extrabold text-white">Dashboard Admin</h1>
      <p className="text-xs text-slate-300">
        Di sini nantinya admin bisa:
        <br />
        • Kelola kelas, mapel, materi
        <br />
        • Atur role user (student/teacher/admin)
        <br />• Monitoring aktivitas sistem secara umum
      </p>
      <Link
        href="/dashboard/admin/finance"
        className="rounded-xl border border-cyan-400/70 bg-cyan-500/30 px-3 py-2 text-[11px] font-semibold text-cyan-50 shadow-sm hover:bg-cyan-500/50"
      >
        📊 Laporan Keuangan
      </Link>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <a
          href="/dashboard/admin/payments"
          className="rounded-xl border border-amber-400/70 bg-amber-500/20 px-3 py-2 font-semibold text-amber-50 hover:bg-amber-500/40"
        >
          💰 Kelola permintaan upgrade
        </a>
      </div>
    </div>
  );
}
