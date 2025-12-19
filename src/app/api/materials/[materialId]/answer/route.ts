// app/api/materials/[id]/answer/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

interface MaterialParams {
  params: Promise<{ materialId: string }>; // pastikan folder-nya [materialId]
}

const FREE_LIMIT = 8;
const MAX_ATTEMPTS_PER_QUESTION = 2;
const MAX_ATTEMPTS_PER_MATERIAL = 2;

export async function POST(req: Request, props: MaterialParams) {
  const { materialId: materialIdStr } = await props.params;

  const materialId = parseInt(materialIdStr, 10);
  if (Number.isNaN(materialId)) {
    console.error("Invalid materialId from params:", materialIdStr);
    return NextResponse.json(
      { error: "Invalid material id", raw: materialIdStr },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { questionId, selectedAnswer } = body;

  const cookieStore = await cookies();

  const supabase = createServerClient(
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
            // ignore
          }
        },
      },
    }
  );

  // 1. cek user login
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // 2. Ambil status premium langsung via subscription + fallback kolom profile
  const nowIso = new Date().toISOString();

  const { data: activeSub, error: activeSubError } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .lte("start_at", nowIso)
    .gte("end_at", nowIso)
    .maybeSingle();

  if (activeSubError) {
    console.error("subscription check error:", activeSubError);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_premium")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Profile error:", profileError);
  }

  const isPremium = !!activeSub || !!profile?.is_premium;

  // 3. validasi questionId
  const qId = Number(questionId);
  if (!qId || Number.isNaN(qId)) {
    return NextResponse.json(
      { error: "Invalid question id", raw: questionId },
      { status: 400 }
    );
  }

  // 4. ambil data soal
  const { data: question, error: questionError } = await supabase
    .from("questions")
    .select("id, material_id, question_number, correct_answer, explanation")
    .eq("id", qId)
    .single();

  if (questionError || !question) {
    console.error("Question query error:", questionError, {
      questionId: qId,
      materialId,
    });
    return NextResponse.json(
      {
        error: "Question not found",
        questionId: qId,
        materialId,
      },
      { status: 404 }
    );
  }

  // 5. BATAS SOAL GRATIS — hanya kalau BUKAN premium
  if (!isPremium && question.question_number > FREE_LIMIT) {
    return NextResponse.json(
      {
        locked: true,
        reason: "premium",
        message:
          "Soal ini termasuk soal gratis yang sudah habis. Untuk lanjut ke soal premium, silakan upgrade paket / hubungi guru ya.",
      },
      { status: 403 }
    );
  }

  // 6. cek jumlah attempt existing (berlaku untuk semua user)
  const { data: completedAttempts, error: completedError } = await supabase
    .from("material_attempts")
    .select("id")
    .eq("user_id", user.id)
    .eq("material_id", materialId);

  const missingMaterialAttempts =
    completedError &&
    (completedError.code === "PGRST205" ||
      completedError.message?.includes("material_attempts"));

  if (completedError && !missingMaterialAttempts) {
    console.error("Completed attempts query error:", completedError);
  }

  if (
    !missingMaterialAttempts &&
    completedAttempts &&
    completedAttempts.length >= MAX_ATTEMPTS_PER_MATERIAL
  ) {
    return NextResponse.json(
      {
        locked: true,
        reason: "max_material_attempts",
        message:
          "Kamu sudah memakai 2 percobaan untuk materi ini. Coba materi lain atau hubungi guru ya.",
      },
      { status: 403 }
    );
  }

  // 6b. cek jumlah attempt existing per soal (berlaku untuk semua user)
  const { data: existingAttempts, error: attemptsError } = await supabase
    .from("question_attempts")
    .select("id")
    .eq("user_id", user.id)
    .eq("material_id", materialId)
    .eq("question_id", question.id);

  if (attemptsError) {
    console.error("Attempts query error:", attemptsError);
  }

  if (
    existingAttempts &&
    existingAttempts.length >= MAX_ATTEMPTS_PER_QUESTION
  ) {
    return NextResponse.json(
      {
        locked: true,
        reason: "max_attempts",
        message:
          "Kamu sudah menggunakan 2x kesempatan untuk soal ini. Lanjut ke soal berikutnya ya.",
      },
      { status: 403 }
    );
  }

  // 7. cek jawaban
  const isCorrect = selectedAnswer === question.correct_answer;

  // 8. simpan attempt
  const { error: attemptError } = await supabase
    .from("question_attempts")
    .insert({
      user_id: user.id,
      material_id: materialId,
      question_id: question.id,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
    });

  if (attemptError) {
    console.error("Attempt save error:", attemptError);
  }

  // 9. simpan progress last_question_number
  const { data: progressRows, error: progressSelectError } = await supabase
    .from("student_material_progress")
    .select("id, last_question_number")
    .eq("user_id", user.id)
    .eq("material_id", materialId);

  if (progressSelectError) {
    console.error("Progress select error:", progressSelectError);
  }

  const existingProgress =
    progressRows && progressRows.length > 0 ? progressRows[0] : null;

  const newLastNumber = Math.max(
    existingProgress?.last_question_number ?? 0,
    question.question_number
  );

  let progressError = null;

  if (!existingProgress) {
    const { error } = await supabase.from("student_material_progress").insert({
      user_id: user.id,
      material_id: materialId,
      last_question_number: newLastNumber,
      is_completed: false,
      updated_at: new Date().toISOString(),
    });

    progressError = error;
  } else {
    const { error } = await supabase
      .from("student_material_progress")
      .update({
        last_question_number: newLastNumber,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingProgress.id);

    progressError = error;
  }

  if (progressError) {
    console.error("Progress save error:", progressError);
  }

  // 10. respon
  return NextResponse.json({
    locked: false,
    isCorrect,
    correctAnswer: question.correct_answer,
    explanation: question.explanation ?? null,
    nextQuestionNumber: question.question_number + 1,
  });
}
