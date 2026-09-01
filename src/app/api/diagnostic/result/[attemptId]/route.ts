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

export async function GET(_req: Request, props: Params) {
  const { attemptId } = await props.params;
  const supabase = serviceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Konfigurasi Supabase belum lengkap." }, { status: 500 });
  }

  const { data: attempt, error } = await supabase
    .from("diagnostic_attempts")
    .select("id, student_name, parent_whatsapp, grade_level, concern, score, result_level, category_scores, created_at, completed_at")
    .eq("id", attemptId)
    .single();

  if (error || !attempt) {
    return NextResponse.json({ ok: false, error: "Hasil check-up tidak ditemukan." }, { status: 404 });
  }

  const { data: answerRows } = await supabase
    .from("diagnostic_answers")
    .select("question_id, selected_answer, correct_answer, category, difficulty, is_correct")
    .eq("attempt_id", attemptId);

  const questionMap = await getDiagnosticQuestionMapFromDb(attempt.grade_level);
  const score = Number(attempt.score ?? 0);
  const profile = getScoreProfile(score);
  const categoryScores = Array.isArray(attempt.category_scores)
    ? attempt.category_scores
    : diagnosticCategories.map((category) => ({ category, score: 0, correct: 0, total: 0 }));

  const answers = (answerRows ?? []).map((row) => {
    const question = questionMap.get(row.question_id);
    return {
      ...row,
      prompt: question?.prompt ?? row.question_id,
      explanation: question?.explanation ?? "",
    };
  });

  return NextResponse.json({ ok: true, attempt, profile, categoryScores, answers });
}
