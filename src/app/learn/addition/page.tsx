import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import MathLabExperience from '@/app/preview/math-lab/experience';
import { emptyLessonProgress, parseLessonProgress } from '@/lib/lessonProgress';
export const metadata: Metadata = { title: 'Ruang Penjumlahan', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function Page() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role, learning_track').eq('id', user.id).single();
  if (profile?.role !== 'student' || profile.learning_track === 'coding') redirect('/dashboard');
  const { data, error } = await supabase.from('student_lesson_progress').select('lesson_stage, lesson_completed, warmup_answers').eq('user_id', user.id).eq('material_id', 42).maybeSingle();
  if (error) return <main className="mx-auto max-w-xl p-8"><h1 className="text-2xl font-bold">Progres belum bisa dimuat</h1><p className="my-4">Muat ulang halaman agar progres tersimpanmu terbaca sebelum mulai belajar.</p><a href="/dashboard/student" className="underline">Kembali ke dashboard</a></main>;
  return <MathLabExperience connected initialProgress={parseLessonProgress(data) ?? emptyLessonProgress} />;
}
