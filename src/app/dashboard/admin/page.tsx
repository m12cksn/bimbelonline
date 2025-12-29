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
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-[0_20px_60px_-45px_rgba(0,0,0,1)]">
        <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-12 h-32 w-32 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative space-y-3">
          <p className="text-[11px] uppercase md:text-base text-cyan-400">
            Admin Control Center
          </p>
          <h1 className="text-3xl font-bold text-800">Dashboard Admin</h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Kelola kelas, materi, dan subscription dengan cepat. Pantau
            aktivitas pengguna dan pastikan operasional berjalan stabil.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/admin/classes"
              className="rounded-xl border border-cyan-400/60 bg-cyan-500/20 px-4 py-2 text-xs font-semibold text-cyan-700 hover:bg-cyan-500/30"
            >
              Kelola Kelas
            </Link>
            <Link
              href="/dashboard/admin/payments"
              className="rounded-xl border border-amber-400/60 bg-amber-500/15 px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-500/25"
            >
              Permintaan Upgrade
            </Link>
            <Link
              href="/dashboard/admin/finance"
              className="rounded-xl border border-emerald-400/60 bg-emerald-500/15 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/25"
            >
              Laporan Keuangan
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-[0_20px_60px_-45px_rgba(0,0,0,1)]">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Fokus Hari Ini
          </p>
          <h2 className="mt-2 text-lg font-semibold">Review transaksi</h2>
          <p className="mt-2 text-sm text-slate-500">
            Periksa pembayaran baru dan pastikan subscription aktif dengan kuota
            yang tepat.
          </p>
          <Link
            href="/dashboard/admin/payments"
            className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-cyan-700 hover:text-cyan-100"
          >
            Lihat pembayaran →
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-[0_20px_60px_-45px_rgba(0,0,0,1)]">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Operasional
          </p>
          <h2 className="mt-2 text-lg font-semibold">Pantau kelas</h2>
          <p className="mt-2 text-sm text-slate-500">
            Cek daftar kelas, jadwal Zoom, dan kuota siswa secara berkala.
          </p>
          <Link
            href="/dashboard/admin/classes"
            className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-cyan-700 hover:text-cyan-100"
          >
            Kelola kelas →
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-[0_20px_60px_-45px_rgba(0,0,0,1)]">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Konten
          </p>
          <h2 className="mt-2 text-lg font-semibold">CMS soal & materi</h2>
          <p className="mt-2 text-sm text-slate-500">
            Perbarui soal, gambar, dan jawaban agar materi selalu fresh.
          </p>
          <Link
            href="/dashboard/admin/questions"
            className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-cyan-700 hover:text-cyan-100"
          >
            Kelola soal →
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900">
          <h3 className="text-sm font-semibold">Quick Actions</h3>
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <Link
              href="/dashboard/admin/subscriptions"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-white"
            >
              Kelola subscription
            </Link>
            <Link
              href="/dashboard/admin/classes"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-white"
            >
              Tambah kelas
            </Link>
            <Link
              href="/dashboard/admin/finance"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-white"
            >
              Ringkasan keuangan
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900">
          <h3 className="text-sm font-semibold">Catatan Admin</h3>
          <p className="mt-2 text-sm text-slate-500">
            Pastikan jadwal Zoom aktif untuk kelas yang sedang berjalan dan
            konfirmasi subscription baru maksimal 1x24 jam.
          </p>
        </div>
      </section>
    </div>
  );
}
