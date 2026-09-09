import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  diagnosticCategories,
  getScoreProfile,
} from "@/lib/mathCheckup";
import { getDiagnosticQuestionsByIdsFromDb } from "@/lib/diagnosticQuestionStore";

type Params = { params: Promise<{ attemptId: string }> };

function serviceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function normalizeQuestionIds(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function weightedScore(
  rows: Array<{ is_correct: boolean; weight: number }>,
) {
  const totalWeight = rows.reduce((sum, row) => sum + row.weight, 0);
  if (totalWeight <= 0) return 0;

  const correctWeight = rows.reduce(
    (sum, row) => sum + (row.is_correct ? row.weight : 0),
    0,
  );

  return Math.round((correctWeight / totalWeight) * 100);
}

function diagnosticQuestionWeight(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 1;
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
    .select("id, grade_level, question_ids")
    .eq("id", attemptId)
    .single();

  if (attemptError || !attempt) {
    return NextResponse.json({ ok: false, error: "Data check-up tidak ditemukan." }, { status: 404 });
  }

  const questions = await getDiagnosticQuestionsByIdsFromDb(
    attempt.grade_level,
    normalizeQuestionIds(attempt.question_ids),
  );

  if (questions.length === 0) {
    return NextResponse.json({ ok: false, error: "Soal diagnostic tidak tersedia." }, { status: 404 });
  }

  const rows = questions.map((question) => {
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
      weight: diagnosticQuestionWeight(question.diagnosticWeight),
    };
  });

  const score = weightedScore(rows);
  const profile = getScoreProfile(score);

  const categoryScores = diagnosticCategories.map((category) => {
    const categoryRows = rows.filter((row) => row.category === category);
    const correct = categoryRows.filter((row) => row.is_correct).length;
    const totalWeight = categoryRows.reduce((sum, row) => sum + row.weight, 0);
    const correctWeight = categoryRows.reduce(
      (sum, row) => sum + (row.is_correct ? row.weight : 0),
      0,
    );
    return {
      category,
      total: categoryRows.length,
      correct,
      score: totalWeight ? Math.round((correctWeight / totalWeight) * 100) : 0,
    };
  });

  const rowsForInsert = rows.map((row) => ({
    attempt_id: row.attempt_id,
    question_id: row.question_id,
    category: row.category,
    difficulty: row.difficulty,
    selected_answer: row.selected_answer,
    correct_answer: row.correct_answer,
    is_correct: row.is_correct,
  }));

  await supabase.from("diagnostic_answers").delete().eq("attempt_id", attemptId);
  const { error: answerError } = rowsForInsert.length
    ? await supabase.from("diagnostic_answers").insert(rowsForInsert)
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
