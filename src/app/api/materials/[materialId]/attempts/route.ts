import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

interface Params {
  params: Promise<{ materialId: string }>;
}

const MAX_MATERIAL_ATTEMPTS = 2;

function isMissingMaterialAttemptsTable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const err = error as { message?: string; code?: string; hint?: string };
  return (
    err.code === "PGRST205" ||
    err.message?.includes("material_attempts") ||
    err.hint?.includes("material_attempts")
  );
}

async function getSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // ignore write failures
          }
        },
      },
    }
  );
}

export async function GET(_: Request, props: Params) {
  const { materialId } = await props.params;
  const materialIdNum = Number(materialId);

  if (Number.isNaN(materialIdNum)) {
    return NextResponse.json({ error: "Invalid material id" }, { status: 400 });
  }

  const supabase = await getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("material_attempts")
    .select(
      "id, attempt_number, score, correct_count, wrong_count, total_questions, created_at"
    )
    .eq("user_id", user.id)
    .eq("material_id", materialIdNum)
    .order("attempt_number", { ascending: true });

  if (error && !isMissingMaterialAttemptsTable(error)) {
    console.error("fetch material attempts error", error);
    return NextResponse.json(
      { error: "Gagal memuat riwayat percobaan" },
      { status: 500 }
    );
  }

  // Fallback jika tabel material_attempts belum ada: gunakan question_attempts
  let attempts =
    data ?? ([] as { score: number | null; attempt_number?: number | null }[]);

  if (error && isMissingMaterialAttemptsTable(error)) {
    const { data: qaRows, error: qaError } = await supabase
      .from("question_attempts")
      .select("is_correct")
      .eq("user_id", user.id)
      .eq("material_id", materialIdNum);

    if (qaError) {
      console.error("fallback question_attempts error", qaError);
    }

    const correct = (qaRows || []).filter((row) => row.is_correct).length;
    const total = (qaRows || []).length || 1; // hindari bagi nol
    const computedScore = Math.round((correct / total) * 100);

    attempts = [
      {
        score: computedScore,
        attempt_number: 1,
        correct_count: correct,
        wrong_count: Math.max(0, total - correct),
        total_questions: total,
        created_at: new Date().toISOString(),
        id: "fallback",
      } as {
        score: number;
        attempt_number: number;
        correct_count: number;
        wrong_count: number;
        total_questions: number;
        created_at: string;
        id: string;
      },
    ];
  }

  const bestScore = attempts.reduce(
    (max, row) => Math.max(max, row.score ?? 0),
    0
  );

  return NextResponse.json({
    ok: true,
    attempts,
    bestScore,
    attemptsUsed: attempts.length,
    attemptsLeft: Math.max(0, MAX_MATERIAL_ATTEMPTS - attempts.length),
  });
}

export async function POST(req: Request, props: Params) {
  const { materialId } = await props.params;
  const materialIdNum = Number(materialId);

  if (Number.isNaN(materialIdNum)) {
    return NextResponse.json({ error: "Invalid material id" }, { status: 400 });
  }

  const body = await req.json();
  const correctCount = Number(body.correctCount ?? 0);
  const wrongCount = Number(body.wrongCount ?? 0);
  const totalQuestions = Number(body.totalQuestions ?? 0);

  if (totalQuestions <= 0) {
    return NextResponse.json(
      { error: "Total soal tidak valid" },
      { status: 400 }
    );
  }

  const supabase = await getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { data: existingAttempts, error: attemptsError } = await supabase
    .from("material_attempts")
    .select("attempt_number, score")
    .eq("user_id", user.id)
    .eq("material_id", materialIdNum)
    .order("attempt_number", { ascending: true });

  if (attemptsError && !isMissingMaterialAttemptsTable(attemptsError)) {
    console.error("fetch existing attempts error", attemptsError);
    return NextResponse.json(
      { error: "Gagal memuat riwayat percobaan" },
      { status: 500 }
    );
  }

  if (attemptsError && isMissingMaterialAttemptsTable(attemptsError)) {
    console.warn(
      "material_attempts table missing; skipping persistence and returning fallback"
    );
  }

  if (
    !isMissingMaterialAttemptsTable(attemptsError) &&
    existingAttempts &&
    existingAttempts.length >= MAX_MATERIAL_ATTEMPTS
  ) {
    return NextResponse.json(
      {
        locked: true,
        reason: "max_attempts",
        message: "Kamu sudah menggunakan 2x percobaan untuk materi ini.",
      },
      { status: 403 }
    );
  }

  const nextAttemptNumber = isMissingMaterialAttemptsTable(attemptsError)
    ? 1
    : (existingAttempts?.length ?? 0) + 1;
  const clampedCorrect = Math.max(0, correctCount);
  const computedTotal = Math.max(totalQuestions, clampedCorrect + wrongCount);
  const score =
    computedTotal > 0 ? Math.round((clampedCorrect / computedTotal) * 100) : 0;

  if (!isMissingMaterialAttemptsTable(attemptsError)) {
    const { error: insertError } = await supabase
      .from("material_attempts")
      .insert({
        user_id: user.id,
        material_id: materialIdNum,
        attempt_number: nextAttemptNumber,
        correct_count: clampedCorrect,
        wrong_count: Math.max(0, wrongCount),
        total_questions: computedTotal,
        score,
      });

    if (insertError) {
      console.error("insert material attempt error", insertError);
      return NextResponse.json(
        { error: "Gagal menyimpan nilai percobaan" },
        { status: 500 }
      );
    }
  }

  const baseBestScores =
    isMissingMaterialAttemptsTable(attemptsError) || !existingAttempts
      ? []
      : existingAttempts;

  const bestScore = Math.max(score, ...(baseBestScores || []).map((a) => a.score ?? 0));

  // Tandai progres selesai agar guru bisa melihat statusnya.
  const { data: progressRows, error: progressSelectError } = await supabase
    .from("student_material_progress")
    .select("id")
    .eq("user_id", user.id)
    .eq("material_id", materialIdNum);

  if (progressSelectError) {
    console.error("select progress error", progressSelectError);
  }

  if (!progressSelectError) {
    const existingProgress =
      progressRows && progressRows.length > 0 ? progressRows[0] : null;

    if (!existingProgress) {
      const { error: insertProgressError } = await supabase
        .from("student_material_progress")
        .insert({
          user_id: user.id,
          material_id: materialIdNum,
          last_question_number: totalQuestions,
          is_completed: true,
          updated_at: new Date().toISOString(),
        });

      if (insertProgressError) {
        console.error("insert progress error", insertProgressError);
      }
    } else {
      const { error: updateProgressError } = await supabase
        .from("student_material_progress")
        .update({
          last_question_number: totalQuestions,
          is_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingProgress.id);

      if (updateProgressError) {
        console.error("update progress error", updateProgressError);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    attemptNumber: nextAttemptNumber,
    score,
    bestScore,
    attemptsUsed: nextAttemptNumber,
  });
}
