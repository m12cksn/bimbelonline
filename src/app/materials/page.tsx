// src/app/materials/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import Image from "next/image";

type MaterialRow = {
  id: number;
  title: string;
  description: string | null;
  image_url?: string | null;
  subject_id?: number | null;
  // nanti bisa ditambah:
  // grade_level: number | null;
  // subject: string | null;
};

type MaterialAttemptRow = {
  material_id: number;
  score: number | null;
  attempt_number: number;
};

type QuestionAttemptRow = {
  material_id: number;
  question_id: string;
  attempt_number: number | null;
  is_correct: boolean;
  created_at: string | null;
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
  const { data: profile } = await supabase
    .from("profiles")
    .select("learning_track")
    .eq("id", user.id)
    .maybeSingle();

  const learningTrack =
    (profile as { learning_track?: string | null })?.learning_track ?? "math";

  const materialsQuery = supabase
    .from("materials")
    .select("id, title, description, image_url, subject_id")
    .order("id", { ascending: true });

  const { data, error } =
    learningTrack === "coding"
      ? await materialsQuery.eq("subject_id", 4)
      : await materialsQuery;

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

  const missingMaterialIds = materials
    .map((m) => m.id)
    .filter((id) => !attemptMap[id]);

  if (missingMaterialIds.length > 0) {
    const { data: qaRows, error: qaError } = await supabase
      .from("question_attempts")
      .select(
        "material_id, question_id, attempt_number, is_correct, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (qaError) {
      console.error("Failed to fetch question attempts:", qaError);
    }

    const latestByKey = new Map<string, QuestionAttemptRow>();
    (qaRows ?? []).forEach((row) => {
      const attemptNum =
        row.attempt_number === 2
          ? 2
          : row.attempt_number === 1 || row.attempt_number === 0
          ? 1
          : 1;
      const key = `${row.material_id}-${row.question_id}-${attemptNum}`;
      if (!latestByKey.has(key)) {
        latestByKey.set(key, row as QuestionAttemptRow);
      }
    });

    const statsByMaterial = new Map<
      number,
      { correct: number; total: number; attempts: Set<number> }
    >();
    latestByKey.forEach((row) => {
      const attemptNum =
        row.attempt_number === 2
          ? 2
          : row.attempt_number === 1 || row.attempt_number === 0
          ? 1
          : 1;
      const stats = statsByMaterial.get(row.material_id) ?? {
        correct: 0,
        total: 0,
        attempts: new Set<number>(),
      };
      stats.total += 1;
      if (row.is_correct) stats.correct += 1;
      stats.attempts.add(attemptNum);
      statsByMaterial.set(row.material_id, stats);
    });

    missingMaterialIds.forEach((materialId) => {
      const stats = statsByMaterial.get(materialId);
      if (!stats || stats.total === 0) return;
      const bestScore = Math.round((stats.correct / stats.total) * 100);
      attemptMap[materialId] = {
        bestScore,
        attemptsCount: stats.attempts.size || 1,
      };
    });
  }

  return (
    <div className="min-h-[calc(100vh-80px)] px-4 py-6 md:px-6 lg:px-8 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-white px-4 py-3">
          <Link
            href="/dashboard/student"
            className="
      inline-flex items-center gap-2 rounded-xl
      bg-emerald-50 hover:bg-emerald-100
      border border-emerald-200
      px-4 py-2 text-xs md:text-sm text-emerald-800
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
            bg-linear-to-br from-emerald-100 via-emerald-50 to-white
            border border-emerald-200
            shadow-[0_20px_80px_-60px_rgba(15,23,42,0.25)]
            px-5 py-6 md:px-8 md:py-8
          "
        >
          {/* Glow effect */}
          <div className="pointer-events-none absolute -left-16 top-0 h-40 w-40 rounded-full bg-emerald-300/40 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-cyan-300/35 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-600/80">
                Learning Materials
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-emerald-900">
                Pilih materi yang mau kamu kerjakan ✏️
              </h1>
              <p className="max-w-xl text-sm md:text-[15px] text-slate-700/90 leading-relaxed">
                Di halaman ini kamu bisa memilih materi untuk latihan. Kerjakan
                pelan-pelan tapi rutin. Seperti main game, tiap materi yang
                selesai bikin skill kamu naik level. 🎮🧠
              </p>
            </div>

            {/* Ringkasan singkat */}
            <div
              className="
                mt-2 flex w-full max-w-xs flex-col gap-3
                rounded-2xl border border-emerald-200 bg-white
                px-4 py-4 text-slate-900 text-sm
              "
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Total materi</span>
                <span className="font-semibold text-emerald-700">
                  {materials.length}
                </span>
              </div>
              <div className="h-px bg-emerald-50" />
              <p className="text-xs text-slate-500 leading-relaxed">
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
            flex flex-col gap-3 rounded-2xl border border-slate-200
            bg-white px-4 py-4 md:px-5 md:py-4 shadow-sm
          "
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-medium text-slate-900">
              Jelajahi materi
            </p>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {/* Search simple */}
              <div className="relative w-full sm:w-64">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Cari materi (misal: sudut, pecahan)..."
                  className="
                    w-full rounded-xl border border-slate-200 bg-white
                    pl-8 pr-3 py-2 text-xs md:text-sm text-slate-900
                    placeholder:text-slate-400
                    focus:outline-none focus:ring-1 focus:ring-emerald-300
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
                    border border-slate-200 bg-white
                    px-3 py-2 text-xs md:text-sm text-slate-700
                    hover:border-emerald-300 hover:bg-emerald-50
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
                    border border-slate-200 bg-white
                    px-3 py-2 text-xs md:text-sm text-slate-700
                    hover:border-emerald-300 hover:bg-emerald-50
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
                rounded-2xl border border-dashed border-slate-200
                bg-white p-6 md:p-8 text-center
                text-slate-600 text-sm
              "
            >
              <p className="font-medium text-slate-900 mb-2">
                Belum ada materi yang tersedia
              </p>
              <p className="text-xs md:text-sm text-slate-500 max-w-md mx-auto">
                Materi belajar akan segera tampil di sini.
              </p>

              <div className="mt-4 flex justify-center">
                <Link
                  href="/dashboard/student"
                  className="
                    inline-flex items-center gap-2 rounded-2xl
                    bg-emerald-50 hover:bg-emerald-100
                    px-4 py-2 text-xs md:text-sm text-emerald-800
                    transition
                  "
                >
                  Kembali ke dashboard siswa
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
                const hasProgress = !!progress;

                return (
                  <Link
                    key={m.id}
                    href={`/materials/${m.id}`}
                    className="
                      group flex flex-col overflow-hidden
                      rounded-2xl border border-slate-200
                      bg-white
                      hover:-translate-y-1
                      transition
                      shadow-[0_18px_60px_-45px_rgba(15,23,42,0.2)]
                    "
                  >
                    {m.image_url ? (
                      <div className="relative h-56 w-full overflow-hidden bg-slate-50">
                        <Image
                          src={m.image_url}
                          alt={m.title}
                          className="h-full w-full object-cover"
                          width={800}
                          height={600}
                        />
                      </div>
                    ) : (
                      <div className="h-56 w-full bg-linear-to-br from-emerald-200/50 via-slate-100 to-white" />
                    )}

                    <div className="flex flex-1 flex-col gap-3 px-4 py-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-600/80">
                          Materi #{m.id}
                        </p>
                        <span
                          className="
                            rounded-full bg-emerald-50 px-2.5 py-1
                            text-[10px] text-emerald-700
                          "
                        >
                          Latihan
                        </span>
                      </div>

                      <h2 className="text-base md:text-lg font-semibold text-emerald-900 line-clamp-2">
                        {m.title}
                      </h2>

                      {m.description && (
                        <p className="text-xs md:text-sm text-slate-500 line-clamp-3">
                          {m.description}
                        </p>
                      )}

                      <div className="mt-auto flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                        <span className="text-[11px] text-slate-500">
                          {hasProgress ? "Lanjutkan latihan" : "Mulai latihan"}
                        </span>

                        <span
                          className={`text-[11px] ${
                            hasProgress ? "text-emerald-700" : "text-slate-500"
                          }`}
                        >
                          {hasProgress
                            ? `Sudah dikerjakan - Skor terbaik: ${Math.round(
                                progress.bestScore
                              )}% - ${progress.attemptsCount}x coba`
                            : "Belum pernah dicoba"}
                        </span>
                      </div>
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
