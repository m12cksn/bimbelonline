// src/app/dashboard/student/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import UpcomingZoomWidget from "./_components/upcoming_zoom_widget";

type ProgressRow = {
  material_id: number;
  last_question_number: number;
  is_completed: boolean | null;
  updated_at: string;
  materials: {
    title: string;
  } | null;
};

type AttemptRow = {
  material_id: number;
  score: number;
  total_answered: number | null;
};

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

  // =====================================================
  // 1) Ambil progress materi siswa
  // =====================================================
  const { data: progressRowsRaw } = await supabase
    .from("student_material_progress")
    .select(
      "material_id, last_question_number, is_completed, updated_at, materials ( title )"
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const progressRows = (progressRowsRaw as ProgressRow[]) || [];

  const totalCompleted =
    progressRows.filter((p) => p.is_completed === true).length ?? 0;

  const totalActiveMaterials = progressRows.length;

  const lastProgress = progressRows[0] ?? null;
  const lastMaterialId = lastProgress?.material_id ?? null;
  const lastMaterialTitle = lastProgress?.materials?.title ?? null;
  const lastQuestionNumber = lastProgress?.last_question_number ?? 0;

  // =====================================================
  // 2) Ambil ringkasan nilai terbaik
  // =====================================================
  const { data: attemptsRaw } = await supabase
    .from("material_attempts")
    .select("material_id, score, total_answered")
    .eq("user_id", user.id)
    .order("score", { ascending: false });

  const attempts = (attemptsRaw as AttemptRow[]) || [];

  const bestScore = attempts.length > 0 ? attempts[0].score ?? 0 : 0;
  const totalAttempts = attempts.length;

  const formattedBestScore =
    typeof bestScore === "number" ? Math.round(bestScore) : 0;

  return (
    <div className="space-y-8">
      {/* =====================================================
          HEADER / HERO
      ====================================================== */}
      <section
        className="
        relative overflow-hidden rounded-3xl
        bg-linear-to-br from-sky-900/40 via-slate-900/40 to-indigo-950/60
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

          {/* 🔁 Tombol jadwal Zoom terdekat */}
          <UpcomingZoomWidget />
        </div>
      </section>

      {/* =====================================================
          PROGRESS SUMMARY + LANJUTKAN MATERI TERAKHIR
      ====================================================== */}
      <section className="grid gap-4 md:grid-cols-3">
        {/* Ringkasan singkat progress */}
        <div
          className="
            rounded-2xl border border-slate-800 bg-slate-950/80
            px-5 py-4 shadow-[0_20px_60px_-45px_rgba(0,0,0,1)]
            flex flex-col justify-between
          "
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300/80">
              Progress Belajar
            </p>
            <span className="text-lg">📊</span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-300">
            <div>
              <p className="text-slate-400">Materi selesai</p>
              <p className="mt-1 text-lg font-bold text-emerald-300">
                {totalCompleted}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Materi aktif</p>
              <p className="mt-1 text-lg font-bold text-cyan-300">
                {totalActiveMaterials}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Percobaan</p>
              <p className="mt-1 text-lg font-bold text-violet-300">
                {totalAttempts}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Skor terbaik</p>
              <p className="mt-1 text-lg font-bold text-amber-300">
                {formattedBestScore}
                <span className="text-sm">%</span>
              </p>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
            Coba jaga kebiasaan latihan sedikit demi sedikit tiap hari. Nanti
            grafik ini bakal makin hijau 💚.
          </p>
        </div>

        {/* Lanjutkan materi terakhir (jika ada) */}
        <div
          className="
            rounded-2xl border border-slate-800 bg-slate-950/80
            px-5 py-4 shadow-[0_20px_60px_-45px_rgba(0,0,0,1)]
            flex flex-col justify-between
          "
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300/80">
              Lanjutkan latihan
            </p>
            <span className="text-lg">⏭️</span>
          </div>

          {lastMaterialId ? (
            <>
              <div className="mt-3 space-y-1">
                <p className="text-sm font-semibold text-slate-100 line-clamp-2">
                  {lastMaterialTitle ?? `Materi #${lastMaterialId}`}
                </p>
                <p className="text-xs text-slate-400">
                  Terakhir sampai soal{" "}
                  <span className="font-semibold text-cyan-300">
                    #{lastQuestionNumber || 1}
                  </span>
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <Link
                  href={`/materials/${lastMaterialId}`}
                  className="
                    inline-flex flex-1 items-center justify-center gap-2
                    rounded-2xl bg-cyan-500/80 hover:bg-cyan-400
                    px-4 py-2 text-xs md:text-sm font-semibold text-white
                    shadow-md shadow-cyan-500/30 transition
                  "
                >
                  🚀 Lanjutkan latihan
                </Link>
              </div>

              <p className="mt-2 text-[11px] text-slate-500">
                Bisa juga pilih materi lain di menu{" "}
                <span className="font-semibold text-cyan-300">
                  Materi &amp; Latihan
                </span>
                .
              </p>
            </>
          ) : (
            <div className="mt-3 space-y-2">
              <p className="text-sm font-semibold text-slate-100">
                Belum ada latihan yang dimulai
              </p>
              <p className="text-xs text-slate-400">
                Coba buka menu{" "}
                <span className="font-semibold text-cyan-300">
                  Materi &amp; Latihan
                </span>{" "}
                lalu pilih salah satu materi untuk mulai percobaan pertama.
              </p>
              <Link
                href="/materials"
                className="
                  mt-2 inline-flex items-center justify-center gap-2
                  rounded-2xl bg-cyan-600/80 hover:bg-cyan-500
                  px-4 py-2 text-xs md:text-sm font-semibold text-white
                  shadow-md shadow-cyan-500/30 transition
                "
              >
                ✏️ Mulai materi pertama
              </Link>
            </div>
          )}
        </div>

        {/* Kartu tips / motivasi singkat */}
        <div
          className="
            rounded-2xl border border-slate-800 bg-slate-950/80
            px-5 py-4 shadow-[0_20px_60px_-45px_rgba(0,0,0,1)]
            flex flex-col justify-between
          "
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300/80">
              Tips Belajar
            </p>
            <span className="text-lg">💡</span>
          </div>

          <div className="mt-3 space-y-2 text-xs text-slate-300">
            <p>✅ Kerjakan 5–10 soal per hari, tidak perlu langsung banyak.</p>
            <p>✅ Kalau salah, jangan sedih. Baca penjelasan lalu coba lagi.</p>
            <p>
              ✅ Kalau bingung, tandai soal dan bahas bareng tutor saat Zoom.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          UPCOMING ZOOM WIDGET
      ====================================================== */}
      <UpcomingZoomWidget />

      {/* =====================================================
          QUICK ACTION CARDS (tidak diubah, hanya dibiarkan)
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
            <p className="font-semibold text-lg text-white">
              Materi &amp; Latihan
            </p>
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
