import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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

export async function GET(_req: Request, props: Params) {
  const { attemptId } = await props.params;
  const supabase = serviceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Konfigurasi Supabase belum lengkap." }, { status: 500 });
  }

  const { data: attempt, error } = await supabase
    .from("diagnostic_attempts")
    .select("id, student_name, grade_level, status, score, result_level, created_at, question_ids")
    .eq("id", attemptId)
    .single();

  if (error || !attempt) {
    return NextResponse.json({ ok: false, error: "Data check-up tidak ditemukan." }, { status: 404 });
  }

  const questions = (await getDiagnosticQuestionsByIdsFromDb(
    attempt.grade_level,
    normalizeQuestionIds(attempt.question_ids),
  )).map((question) => ({
    id: question.id,
    category: question.category,
    difficulty: question.difficulty,
    prompt: question.prompt,
    options: question.options,
  }));

  return NextResponse.json({ ok: true, attempt, questions });
}
