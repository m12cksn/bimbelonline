// src/app/materials/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type MaterialRow = {
  id: number;
  title: string;
  description: string | null;
  // nanti bisa ditambah:
  // grade_level: number | null;
  // subject: string | null;
};

type MaterialAttemptRow = {
  material_id: number;
  score: number | null;
  attempt_number: number;
};

export default async function MaterialsPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // --- 1. Ambil semua materi seperti sebelumnya ---
  const { data, error } = await supabase
    .from("materials")
    .select("id, title, description")
    .order("id", { ascending: true });

  if (error) {
    console.error("Failed to fetch materials:", error);
  }

  const materials = data ?? [];

  // --- 2. Ambil ringkasan percobaan dari material_attempts ---
  const { data: attemptsData, error: attemptsError } = await supabase
    .from("material_attempts")
    .select("material_id, score, attempt_number")
    .eq("user_id", user.id);

  if (attemptsError) {
    console.error("Failed to fetch material attempts:", attemptsError);
  }

  const attempts = (attemptsData ?? []) as MaterialAttemptRow[];

  // Buat map: material_id -> { bestScore, attemptsCount }
  const attemptMap: Record<
    number,
    {
      bestScore: number;
      attemptsCount: number;
    }
  > = {};

  for (const row of attempts) {
    const materialId = row.material_id;
    const score = row.score ?? 0;

    if (!attemptMap[materialId]) {
      attemptMap[materialId] = {
        bestScore: score,
        attemptsCount: 1,
      };
    } else {
      attemptMap[materialId].bestScore = Math.max(
        attemptMap[materialId].bestScore,
        score
      );
      attemptMap[materialId].attemptsCount += 1;
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
          <Link
            href="/dashboard/student"
            className="
      inline-flex items-center gap-2 rounded-xl
      bg-slate-900/60 hover:bg-slate-800
      border border-slate-700/80
      px-4 py-2 text-xs md:text-sm text-slate-200
      transition
    "
          >
            ⬅️ Kembali ke dashboard
          </Link>

          <p className="hidden md:block text-[11px] text-slate-500">
            Kamu sedang berada di daftar materi 📘
          </p>
        </div>
        {/* =====================================================
            HEADER / HERO
        ====================================================== */}
        <section
          className="
            relative overflow-hidden rounded-3xl
            bg-linear-to-br from-sky-900/50 via-slate-900/50 to-indigo-950/70
            border border-slate-800/80
            shadow-[0_20px_80px_-40px_rgba(0,0,0,1)]
            px-5 py-6 md:px-8 md:py-8
          "
        >
          {/* Glow effect */}
          <div className="pointer-events-none absolute -left-16 top-0 h-40 w-40 rounded-full bg-cyan-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-violet-500/25 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-300/80">
                Learning Materials
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Pilih materi yang mau kamu kerjakan ✏️
              </h1>
              <p className="max-w-xl text-sm md:text-[15px] text-slate-200/90 leading-relaxed">
                Di halaman ini kamu bisa memilih materi untuk latihan. Kerjakan
                pelan-pelan tapi rutin. Seperti main game, tiap materi yang
                selesai bikin skill kamu naik level. 🎮🧠
              </p>
            </div>

            {/* Ringkasan singkat */}
            <div
              className="
                mt-2 flex w-full max-w-xs flex-col gap-3
                rounded-2xl border border-sky-500/40 bg-slate-950/60
                px-4 py-4 text-slate-100 text-sm
              "
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Total materi</span>
                <span className="font-semibold text-sky-200">
                  {materials.length}
                </span>
              </div>
              <div className="h-px bg-slate-800/80" />
              <p className="text-xs text-slate-400 leading-relaxed">
                Tips: mulai dari materi yang sudah kamu kenal dulu (misalnya
                <span className="font-semibold"> time</span>,{" "}
                <span className="font-semibold">sudut</span>, atau{" "}
                <span className="font-semibold">segitiga</span>), baru lanjut ke
                yang lebih sulit.
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================
            (NANTI) FILTER & SEARCH BAR
           — sekarang masih dummy UI sederhana
        ====================================================== */}
        <section
          className="
            flex flex-col gap-3 rounded-2xl border border-slate-800
            bg-slate-950/70 px-4 py-4 md:px-5 md:py-4
          "
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-medium text-slate-100">
              Jelajahi materi
            </p>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {/* Search simple */}
              <div className="relative w-full sm:w-64">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Cari materi (misal: sudut, pecahan)..."
                  className="
                    w-full rounded-xl border border-slate-700/80 bg-slate-900/60
                    pl-8 pr-3 py-2 text-xs md:text-sm text-slate-100
                    placeholder:text-slate-500
                    focus:outline-none focus:ring-1 focus:ring-cyan-500/60
                  "
                  // nanti bisa dibuat client component + onChange untuk filter
                  readOnly
                />
              </div>

              {/* Dropdown dummy – nanti diubah jadi beneran filter */}
              <div className="flex gap-2">
                <button
                  className="
                    inline-flex items-center justify-center rounded-xl
                    border border-slate-700/80 bg-slate-900/60
                    px-3 py-2 text-xs md:text-sm text-slate-200
                    hover:border-cyan-500/70 hover:bg-slate-900
                    transition
                  "
                  type="button"
                >
                  Kelas 1–6
                  <span className="ml-1 text-[10px]">▼</span>
                </button>
                <button
                  className="
                    inline-flex items-center justify-center rounded-xl
                    border border-slate-700/80 bg-slate-900/60
                    px-3 py-2 text-xs md:text-sm text-slate-200
                    hover:border-cyan-500/70 hover:bg-slate-900
                    transition
                  "
                  type="button"
                >
                  Semua mapel
                  <span className="ml-1 text-[10px]">▼</span>
                </button>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            (Untuk sekarang filter belum aktif, nanti kita sambungkan ke
            database: filter berdasarkan kelas, mapel, level, dan status gratis
            / premium.)
          </p>
        </section>

        {/* =====================================================
            GRID MATERI
        ====================================================== */}
        <section>
          {materials.length === 0 ? (
            <div
              className="
                rounded-2xl border border-dashed border-slate-700
                bg-slate-950/60 p-6 md:p-8 text-center
                text-slate-300 text-sm
              "
            >
              <p className="font-medium text-slate-100 mb-2">
                Belum ada materi yang tersedia
              </p>
              <p className="text-xs md:text-sm text-slate-400 max-w-md mx-auto">
                Tambahkan data di tabel{" "}
                <span className="font-mono">materials</span> di Supabase
                (contoh: <span className="font-mono">title</span> = &quot;Sudut
                Kelas 5&quot;,
                <span className="font-mono">description</span> = &quot;Latihan
                sudut dasar sampai lanjutan&quot;). Setelah itu refresh halaman
                ini.
              </p>

              <div className="mt-4 flex justify-center">
                <Link
                  href="/dashboard/student"
                  className="
                    inline-flex items-center gap-2 rounded-2xl
                    bg-slate-800/80 hover:bg-slate-700
                    px-4 py-2 text-xs md:text-sm text-slate-100
                    transition
                  "
                >
                  ⬅️ Kembali ke dashboard siswa
                </Link>
              </div>
            </div>
          ) : (
            <div
              className="
                grid gap-4
                sm:grid-cols-2
                lg:grid-cols-3
              "
            >
              {materials.map((m) => {
                const progress = attemptMap[m.id];

                return (
                  <Link
                    key={m.id}
                    href={`/materials/${m.id}`}
                    className="
                      group flex flex-col justify-between
                      rounded-2xl border border-slate-800
                      bg-slate-950/70
                      hover:border-cyan-500/60 hover:bg-slate-900/90
                      transition
                      p-5 md:p-6
                      shadow-[0_18px_60px_-45px_rgba(0,0,0,1)]
                    "
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">
                          Materi #{m.id}
                        </p>
                        {/* Badge sebelumnya kita pertahankan: "Latihan" */}
                        <span
                          className="
                            rounded-full bg-slate-800/80 px-2.5 py-1
                            text-[10px] text-slate-300
                          "
                        >
                          Latihan
                        </span>
                      </div>

                      <h2 className="text-base md:text-lg font-semibold text-white line-clamp-2">
                        {m.title}
                      </h2>

                      {m.description && (
                        <p className="text-xs md:text-sm text-slate-400 line-clamp-3">
                          {m.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                      <span className="text-[11px] text-slate-500">
                        Klik untuk mulai latihan
                      </span>

                      <span className="text-[11px] text-slate-400">
                        {progress
                          ? `Skor terbaik: ${Math.round(
                              progress.bestScore
                            )}% • ${progress.attemptsCount}x coba`
                          : "Belum pernah dicoba"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
