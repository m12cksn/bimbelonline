import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  diagnosticCategories,
  getScoreProfile,
} from "@/lib/mathCheckup";
import { getDiagnosticQuestionMapFromDb } from "@/lib/diagnosticQuestionStore";

type Params = { params: Promise<{ attemptId: string }> };

function serviceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(req: Request, props: Params) {
  const { attemptId } = await props.params;
  const body = (await req.json()) as { answers?: Record<string, string> };
  const answers = body.answers ?? {};

  const supabase = serviceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Konfigurasi Supabase belum lengkap." }, { status: 500 });
  }

  const { data: attempt, error: attemptError } = await supabase
    .from("diagnostic_attempts")
    .select("id, grade_level")
    .eq("id", attemptId)
    .single();

  if (attemptError || !attempt) {
    return NextResponse.json({ ok: false, error: "Data check-up tidak ditemukan." }, { status: 404 });
  }

  const questionMap = await getDiagnosticQuestionMapFromDb(attempt.grade_level);
  const rows = Array.from(questionMap.values()).map((question) => {
    const selectedAnswer = String(answers[question.id] ?? "").trim();
    const isCorrect = selectedAnswer === question.correctAnswer;
    return {
      attempt_id: attemptId,
      question_id: question.id,
      category: question.category,
      difficulty: question.difficulty,
      selected_answer: selectedAnswer || null,
      correct_answer: question.correctAnswer,
      is_correct: isCorrect,
    };
  });

  const correctCount = rows.filter((row) => row.is_correct).length;
  const score = Math.round((correctCount / Math.max(rows.length, 1)) * 100);
  const profile = getScoreProfile(score);

  const categoryScores = diagnosticCategories.map((category) => {
    const categoryRows = rows.filter((row) => row.category === category);
    const correct = categoryRows.filter((row) => row.is_correct).length;
    return {
      category,
      total: categoryRows.length,
      correct,
      score: categoryRows.length ? Math.round((correct / categoryRows.length) * 100) : 0,
    };
  });

  await supabase.from("diagnostic_answers").delete().eq("attempt_id", attemptId);
  const { error: answerError } = rows.length
    ? await supabase.from("diagnostic_answers").insert(rows)
    : { error: null };

  if (answerError) {
    console.error("diagnostic answer insert error", answerError);
    return NextResponse.json({ ok: false, error: "Gagal menyimpan jawaban." }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("diagnostic_attempts")
    .update({
      status: "completed",
      score,
      result_level: profile.level,
      category_scores: categoryScores,
      completed_at: new Date().toISOString(),
    })
    .eq("id", attemptId);

  if (updateError) {
    console.error("diagnostic attempt update error", updateError);
    return NextResponse.json({ ok: false, error: "Gagal menyimpan hasil." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, attemptId, score, resultLevel: profile.level });
}
