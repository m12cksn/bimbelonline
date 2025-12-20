// app/api/materials/[materialId]/answer/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

interface MaterialParams {
  params: Promise<{ materialId: string }>;
}

// FREE_LIMIT masih belum dipakai (premium lock dimatikan sementara)
const FREE_LIMIT = 8;

export async function POST(req: Request, props: MaterialParams) {
  const { materialId: materialIdStr } = await props.params;
  const materialId = parseInt(materialIdStr, 10);

  if (Number.isNaN(materialId)) {
    return NextResponse.json(
      { error: "Invalid material id", raw: materialIdStr },
      { status: 400 }
    );
  }

  const body = (await req.json()) as {
    questionId: number | string;
    questionNumber?: number;
    selectedAnswer: string;
    attemptNumber?: number;
  };

  const { questionId, selectedAnswer } = body;

  // --- Ambil attemptNumber dari body (1 atau 2). Default = 1 ---
  let attemptNumber = Number(body.attemptNumber);
  if (!attemptNumber || ![1, 2].includes(attemptNumber)) {
    attemptNumber = 1;
  }

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
            // di RSC kadang gagal set cookie, aman diabaikan
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

  // 2. sementara semua dianggap premium (lock soal dimatikan)
  const isPremium = true;
  console.log("isPremium (temporary override) =>", isPremium);

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
      { error: "Question not found", questionId: qId, materialId },
      { status: 404 }
    );
  }

  // (Limit soal gratis & limit attempt per soal masih non-aktif)
  // if (!isPremium && question.question_number > FREE_LIMIT) { ... }

  // 5. cek jawaban
  const isCorrect = selectedAnswer === question.correct_answer;

  // 6. simpan attempt per soal (PASTI ada attempt_number)
  const { error: attemptError } = await supabase
    .from("question_attempts")
    .insert({
      user_id: user.id,
      material_id: materialId,
      question_id: question.id,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
      attempt_number: attemptNumber,
    });

  if (attemptError) {
    console.error("Attempt save error:", attemptError);
  }

  // 7. simpan progress last_question_number
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

  // 8. response ke frontend
  return NextResponse.json({
    locked: false,
    isCorrect,
    correctAnswer: question.correct_answer,
    explanation: question.explanation ?? null,
    nextQuestionNumber: question.question_number + 1,
  });
}
