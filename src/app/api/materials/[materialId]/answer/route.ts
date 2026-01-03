// app/api/materials/[materialId]/answer/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { resolvePlanAccess } from "@/lib/planAccess";
import { isInputAnswerCorrect } from "@/lib/answerValidation";

interface MaterialParams {
  params: Promise<{ materialId: string }>;
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}


function buildFallbackExplanation(
  questionType: string,
  prompt: string,
  correctAnswer: string | null
) {
  if (!correctAnswer) return null;
  const lowerPrompt = prompt.toLowerCase();
  if (questionType === "drag_drop") {
    return `Jawaban benar: ${correctAnswer}. Cocokkan setiap item ke target yang tepat, lalu cek kembali pasangan yang sudah terisi.`;
  }
  if (questionType === "multipart") {
    return `Jawaban benar: ${correctAnswer}. Kerjakan tiap bagian satu per satu, lalu pastikan semua bagian sudah benar.`;
  }
  if (
    lowerPrompt.includes("lebih besar") ||
    lowerPrompt.includes("terkecil") ||
    lowerPrompt.includes("bandingkan") ||
    lowerPrompt.includes("urut")
  ) {
    return `Jawaban benar: ${correctAnswer}. Bandingkan pecahan dengan menyamakan penyebut atau ubah ke desimal agar mudah dibandingkan.`;
  }
  if (lowerPrompt.includes("+") || lowerPrompt.includes("jumlah")) {
    return `Jawaban benar: ${correctAnswer}. Samakan penyebut, jumlahkan pembilang, lalu sederhanakan jika perlu.`;
  }
  if (
    lowerPrompt.includes("-") ||
    lowerPrompt.includes("selisih") ||
    lowerPrompt.includes("sisa")
  ) {
    return `Jawaban benar: ${correctAnswer}. Samakan penyebut, kurangi pembilang, lalu sederhanakan jika perlu.`;
  }
  if (lowerPrompt.includes("sederhanakan")) {
    return `Jawaban benar: ${correctAnswer}. Bagi pembilang dan penyebut dengan FPB agar pecahan paling sederhana.`;
  }
  return `Jawaban benar: ${correctAnswer}. Cek kembali langkah perhitunganmu dan pastikan penyebut sama sebelum menghitung.`;
}

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

  const isGuest = !user;

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const dbClient =
    isGuest && serviceKey
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : supabase;

  let planAccess = resolvePlanAccess(null, null, false);

  if (!isGuest && user) {
    // 2. ambil status langganan untuk limit soal
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", user.id)
      .single();

    const nowIso = new Date().toISOString();
    const { data: activeSub } = await supabase
      .from("subscriptions")
      .select(
        `
          id,
          status,
          start_at,
          end_at,
          subscription_plans (
            name,
            code
          )
        `
      )
      .eq("user_id", user.id)
      .eq("status", "active")
      .lte("start_at", nowIso)
      .gte("end_at", nowIso)
      .order("end_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let planName: string | null = null;
    let planCode: string | null = null;
    const rel = (activeSub as any)?.subscription_plans;
    if (Array.isArray(rel) && rel.length > 0) {
      planName = rel[0]?.name ?? null;
      planCode = rel[0]?.code ?? null;
    } else if (rel) {
      planName = rel?.name ?? null;
      planCode = rel?.code ?? null;
    }

    planAccess = resolvePlanAccess(
      planCode,
      planName,
      profile?.is_premium === true
    );
  }

  // 3. validasi questionId
  const qId = typeof questionId === "string" ? questionId : String(questionId);
  if (!qId) {
    return NextResponse.json(
      { error: "Invalid question id", raw: questionId },
      { status: 400 }
    );
  }

  // 4. ambil data soal
  const { data: question, error: questionError } = await dbClient
    .from("questions")
    .select(
      "id, material_id, question_number, type, prompt, correct_answer, correct_answer_image_url, explanation, question_mode"
    )
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

  const shouldLock =
    question.question_mode !== "tryout" &&
    question.question_number > planAccess.questionLimit;

  if (shouldLock) {
    return NextResponse.json({
      locked: true,
      message: `Soal ini terkunci untuk paket ${planAccess.label}. Upgrade paket untuk membuka semua soal.`,
      limit: planAccess.questionLimit,
    });
  }

  // 5. cek jawaban
  let isCorrect = false;
  let correctAnswerText: string | null = null;
  let correctAnswerImage: string | null =
    (question as { correct_answer_image_url?: string | null })
      ?.correct_answer_image_url ?? null;

  if (question.type === "essay") {
    correctAnswerText =
      (question as { correct_answer?: string | null })?.correct_answer ?? null;
    isCorrect = isInputAnswerCorrect(selectedAnswer, correctAnswerText);
  } else if (question.type === "multipart") {
    let parsed: Record<string, string> = {};
    try {
      parsed = JSON.parse(selectedAnswer);
    } catch {
      parsed = {};
    }

    const { data: partRows, error: partError } = await dbClient
      .from("question_items")
      .select("id, label")
      .eq("question_id", qId)
      .order("sort_order", { ascending: true });

    if (partError) {
      console.error("multipart items error", partError);
    }

    const partIds = (partRows || []).map((row) => row.id);
    const { data: answerRows, error: answerError } = partIds.length
      ? await dbClient
          .from("question_item_answers")
          .select("item_id, answer_text")
          .in("item_id", partIds)
      : { data: [] };

    if (answerError) {
      console.error("multipart answers error", answerError);
    }

    const answerMap = new Map<string, string>();
    for (const row of answerRows || []) {
      if (row?.item_id && typeof row.answer_text === "string") {
        answerMap.set(row.item_id, row.answer_text);
      }
    }

    const hasAllAnswers =
      partIds.length > 0 &&
      partIds.every((id) => (parsed[id] ?? "").trim().length > 0);

    isCorrect =
      hasAllAnswers &&
      partIds.every((id) =>
        isInputAnswerCorrect(parsed[id] ?? "", answerMap.get(id) ?? "")
      );

    correctAnswerText = (partRows || [])
      .map((row) => {
        const answer = answerMap.get(row.id) ?? "";
        if (!answer) return null;
        const label = row.label || "-";
        return `${label}. ${answer}`;
      })
      .filter(Boolean)
      .join(" | ");
  } else if (question.type === "drag_drop") {
    let parsed: Record<string, string> = {};
    try {
      parsed = JSON.parse(selectedAnswer);
    } catch {
      parsed = {};
    }

    const { data: dropItems, error: dropItemsError } = await dbClient
      .from("question_drop_items")
      .select("id, label, correct_target_id")
      .eq("question_id", qId);

    if (dropItemsError) {
      console.error("drop items error", dropItemsError);
    }

    const itemMap = new Map<string, string>();
    const labelMap = new Map<string, string>();
    for (const item of dropItems || []) {
      if (item?.id && item?.correct_target_id) {
        itemMap.set(item.id, item.correct_target_id);
        if (typeof item.label === "string") {
          labelMap.set(normalizeText(item.label), item.correct_target_id);
        }
      }
    }

    isCorrect =
      Object.keys(parsed).length > 0 &&
      Object.entries(parsed).every(
        ([targetId, itemValue]) => {
          if (!itemValue) return false;
          const byId = itemMap.get(itemValue);
          if (byId) return byId === targetId;
          const byLabel = labelMap.get(normalizeText(itemValue));
          if (byLabel) return byLabel === targetId;
          return false;
        }
      );
  } else {
    const { data: correctOption } = await dbClient
      .from("question_options")
      .select("value")
      .eq("question_id", qId)
      .eq("is_correct", true)
      .maybeSingle();

    correctAnswerText = correctOption?.value ?? null;
    isCorrect = !!correctOption && selectedAnswer === correctOption.value;
  }

  // 6. simpan attempt per soal (PASTI ada attempt_number)
  if (!isGuest && user) {
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
  }

  // 8. response ke frontend
  const rawExplanation =
    typeof question.explanation === "string" ? question.explanation.trim() : "";
  const defaultExplanation = buildFallbackExplanation(
    question.type,
    question.prompt ?? "",
    correctAnswerText
  );
  const explanation =
    !rawExplanation ||
    (correctAnswerText &&
      rawExplanation.toLowerCase() ===
        `jawaban benar: ${correctAnswerText}`.toLowerCase())
      ? defaultExplanation
      : rawExplanation;

  return NextResponse.json({
    locked: false,
    isCorrect,
    correctAnswer: correctAnswerText,
    correctAnswerImage,
    explanation: explanation ?? null,
    nextQuestionNumber: question.question_number + 1,
  });
}
