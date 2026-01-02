// src/app/materials/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import MaterialsClient from "./materials_client";

type MaterialRow = {
  id: number;
  title: string;
  description: string | null;
  image_url?: string | null;
  subject_id?: number | null;
  grade_id?: number | null;
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
    .select("id, title, description, image_url, subject_id, grade_id")
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
        <MaterialsClient
          materials={materials}
          attemptMap={attemptMap}
          learningTrack={learningTrack === "coding" ? "coding" : "math"}
        />

      </div>
    </div>
  );
}
