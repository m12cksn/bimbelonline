// src/app/dashboard/student/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export default async function StudentDashboardPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, is_premium")
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.email ||
    "Student";

  const isPremium = !!profile?.is_premium;

  return (
    <div className="space-y-8">
      {/* =====================================================
          HEADER / HERO
      ====================================================== */}
      <section
        className="
        relative overflow-hidden rounded-3xl
        bg-gradient-to-br from-sky-900/40 via-slate-900/40 to-indigo-950/60
        border border-slate-800/80
        shadow-[0_20px_80px_-40px_rgba(0,0,0,1)]
        p-6 md:p-8
      "
      >
        <div className="pointer-events-none absolute -left-10 top-0 h-40 w-40 rounded-full bg-cyan-500/20 blur-2xl" />
        <div className="pointer-events-none absolute -right-12 bottom-0 h-40 w-40 rounded-full bg-pink-500/20 blur-2xl" />

        <div className="relative z-10 space-y-4">
          <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-300/80">
            Student Dashboard
          </p>

          <h1 className="text-3xl font-bold text-white">
            Halo {displayName.split(" ")[0]} 👋
          </h1>

          <div className="inline-flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                isPremium
                  ? "border-amber-400/60 bg-amber-400/20 text-amber-200"
                  : "border-cyan-400/60 bg-cyan-500/10 text-cyan-200"
              }`}
            >
              {isPremium ? "Premium Student 🌟" : "Free Student"}
            </span>
            {!isPremium && (
              <span className="text-[11px] text-slate-400">
                Upgrade untuk membuka lebih banyak soal
              </span>
            )}
          </div>

          <p className="max-w-2xl text-slate-300 text-sm leading-relaxed">
            Pilih materi dan mulai latihan kapan pun kamu siap. Kerjakan soal
            tiap hari seperti game, makin lama makin kuat matematikanya! 🧠💪
          </p>

          <Link
            href="/materials"
            className="
              inline-flex items-center gap-2 rounded-2xl
              bg-cyan-600/30 hover:bg-cyan-500/40
              border border-cyan-400/30
              px-5 py-2.5 text-sm font-semibold text-cyan-100
              shadow-md shadow-cyan-500/20
              transition
            "
          >
            🚀 Mulai latihan materi
          </Link>
        </div>
      </section>

      {/* =====================================================
          QUICK ACTION CARDS
      ====================================================== */}
      <section
        className="
        grid gap-4 sm:grid-cols-2 lg:grid-cols-3
      "
      >
        {/* My Classes */}
        <Link
          href="/dashboard/student/classes"
          className="
            group rounded-2xl border border-slate-800
            bg-slate-950/50
            hover:bg-slate-900/70
            p-5 transition
            shadow-[0_20px_60px_-45px_rgba(0,0,0,1)]
            text-slate-200
          "
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-lg">
              📘
            </span>
            <p className="font-semibold text-lg text-white">My Classes</p>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            Lihat jadwal kelas Zoom dan ruang kelas kamu.
          </p>
        </Link>

        {/* Materi & Latihan */}
        <Link
          href="/materials"
          className="
            group rounded-2xl border border-slate-800
            bg-slate-950/50
            hover:bg-slate-900/70
            p-5 transition
            shadow-[0_20px_60px_-45px_rgba(0,0,0,1)]
            text-slate-200
          "
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-lg">
              ✏️
            </span>
            <p className="font-semibold text-lg text-white">Materi & Latihan</p>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            Pilih topik pelajaran dan kerjakan soal seperti game.
          </p>
        </Link>

        {/* Upgrade */}
        <Link
          href="/dashboard/student/upgrade"
          className="
            group rounded-2xl border border-slate-800
            bg-slate-950/50
            hover:bg-slate-900/70
            p-5 transition
            shadow-[0_20px_60px_-45px_rgba(0,0,0,1)]
            text-slate-200
          "
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-lg">
              ⭐
            </span>
            <p className="font-semibold text-lg text-white">Upgrade Premium</p>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            Buka lebih banyak soal, fitur video call, dan event khusus.
          </p>
        </Link>
      </section>
    </div>
  );
}
