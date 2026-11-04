import type { SupabaseClient } from "@supabase/supabase-js";

export class ScoreError extends Error {
  constructor(message: string, public status = 503) { super(message); }
}

type Attempt = { question_id: string | number; is_correct: boolean; created_at: string };

export function summarizeStoredAnswers(questionIds: string[], rows: Attempt[]) {
  const allowed = new Set(questionIds);
  const latest = new Map<string, Attempt>();
  for (const row of rows) {
    const id = String(row.question_id);
    if (!allowed.has(id)) continue;
    if (typeof row.is_correct !== "boolean" || !Number.isFinite(Date.parse(row.created_at))) {
      throw new ScoreError("Riwayat jawaban perlu diperiksa.");
    }
    const previous = latest.get(id);
    if (previous && Date.parse(previous.created_at) === Date.parse(row.created_at) && previous.is_correct !== row.is_correct) {
      throw new ScoreError("Riwayat jawaban bersamaan perlu diperiksa.");
    }
    if (!previous || Date.parse(row.created_at) > Date.parse(previous.created_at)) latest.set(id, row);
  }
  const totalQuestions = allowed.size;
  const answered = latest.size;
  const correct = [...latest.values()].filter((row) => row.is_correct).length;
  return { totalQuestions, answered, correct, wrong: totalQuestions - correct,
    score: totalQuestions ? Math.round(correct / totalQuestions * 100) : 0 };
}

export async function loadServerScore(
  db: SupabaseClient, userId: string, materialId: number, run: number, mode: "practice" | "tryout",
) {
  let query = db.from("questions").select("id").eq("material_id", materialId);
  query = mode === "tryout" ? query.eq("question_mode", "tryout") :
    query.or("question_mode.is.null,question_mode.eq.practice");
  // Fail closed above the supported catalog/history bounds instead of silently truncating.
  const { data: questions, error: questionError } = await query.limit(201);
  if (questionError || !questions || questions.length > 200) throw new ScoreError("Daftar soal belum dapat diverifikasi.");
  if (questions.length === 0) throw new ScoreError("Belum ada soal untuk latihan ini.", 409);
  const { data: answers, error: answerError } = await db.from("question_attempts")
    .select("question_id, is_correct, created_at")
    .eq("user_id", userId).eq("material_id", materialId).eq("attempt_number", run)
    .order("created_at", { ascending: false }).limit(501);
  if (answerError || !answers || answers.length > 500) throw new ScoreError("Riwayat jawaban belum dapat diverifikasi.");
  const summary = summarizeStoredAnswers(questions.map((row) => String(row.id)), answers);
  if (!summary.answered) throw new ScoreError("Belum ada jawaban tersimpan.", 409);
  if (mode === "practice" && summary.answered !== summary.totalQuestions) {
    throw new ScoreError("Selesaikan dan simpan semua jawaban terlebih dahulu.", 409);
  }
  return summary;
}
