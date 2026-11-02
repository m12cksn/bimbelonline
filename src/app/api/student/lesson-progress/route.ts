import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { parseLessonProgress, warmupScore } from '@/lib/lessonProgress';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Silakan masuk kembali.' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('role, learning_track').eq('id', user.id).single();
  if (profile?.role !== 'student' || profile.learning_track === 'coding') return NextResponse.json({ error: 'Hanya tersedia untuk siswa matematika.' }, { status: 403 });
  let value: unknown;
  try { value = await request.json(); } catch { return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 }); }
  const progress = parseLessonProgress(value);
  if (!progress) return NextResponse.json({ error: 'Progres tidak valid.' }, { status: 400 });
  const { error } = await supabase.from('student_lesson_progress').upsert({ ...progress, user_id: user.id, material_id: 42, updated_at: new Date().toISOString() }, { onConflict: 'user_id,material_id' });
  if (error) return NextResponse.json({ error: 'Progres belum tersimpan. Coba simpan lagi.' }, { status: 503 });
  return NextResponse.json({ ok: true, score: warmupScore(progress.warmup_answers) });
}
