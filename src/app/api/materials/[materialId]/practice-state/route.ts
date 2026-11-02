import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
export async function GET(_request: Request, { params }: { params: Promise<{ materialId: string }> }) {
  const { materialId: raw } = await params;
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw)) || Number(raw) < 1) return NextResponse.json({ error: 'Materi tidak valid.' }, { status: 400 });
  const db = await createSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Silakan masuk kembali.' }, { status: 401 });
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'student') return NextResponse.json({ error: 'Hanya untuk siswa.' }, { status: 403 });
  const { data, error } = await db.from('question_attempts').select('question_id, selected_answer, is_correct, questions!inner(id, question_mode, explanation, correct_answer, correct_answer_image_url)').eq('user_id', user.id).eq('material_id', Number(raw)).order('created_at', { ascending: false }).limit(5000);
  if (error) return NextResponse.json({ error: 'Progres belum bisa dimuat. Muat ulang halaman untuk mencoba lagi.' }, { status: 503 });
  const answers: Record<string, string> = {};
  const results: Record<string, { isCorrect: boolean; explanation: string | null; correctAnswer: string | null; correctAnswerImage: string | null }> = {};
  for (const row of data ?? []) {
    const question = Array.isArray(row.questions) ? row.questions[0] : row.questions;
    if (!question || question.question_mode === 'tryout' || results[row.question_id]) continue;
    answers[row.question_id] = row.selected_answer ?? '';
    results[row.question_id] = { isCorrect: row.is_correct, explanation: question.explanation, correctAnswer: question.correct_answer, correctAnswerImage: question.correct_answer_image_url };
  }
  return NextResponse.json({ answers, results }, { headers: { 'Cache-Control': 'private, no-store' } });
}
