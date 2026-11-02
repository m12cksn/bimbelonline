import StudentHome from "@/components/student/StudentHome";
import { parseLessonProgress } from "@/lib/lessonProgress";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { mergeGradeCards } from "@/lib/gradeCards";

export default async function StudentDashboardPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, learning_track")
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.email ||
    "Siswa";

  let gradeRows: Array<{
    id?: number | null;
    level?: number | null;
    name?: string | null;
    description?: string | null;
    image_url?: string | null;
  }> = [];

  const { data: configuredGrades, error: configuredError } = await supabase
    .from("grades")
    .select("id, level, name, description, image_url")
    .order("level", { ascending: true });

  if (!configuredError) {
    gradeRows = configuredGrades ?? [];
  } else {
    const { data: basicGrades, error: basicError } = await supabase
      .from("grades")
      .select("id, level, name")
      .order("level", { ascending: true });

    if (basicError) {
      console.error("student dashboard grades error:", basicError);
    } else {
      gradeRows = basicGrades ?? [];
    }
  }

  const gradeCards = mergeGradeCards(gradeRows);

  const [lessonResult, countResult, historyResult] = await Promise.all([
    supabase.from("student_lesson_progress").select("lesson_stage, lesson_completed, warmup_answers").eq("user_id", user.id).eq("material_id", 42).maybeSingle(),
    supabase.from("question_attempts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("student_material_progress").select("material_id, materials(title)").eq("user_id", user.id).order("updated_at", { ascending: false }),
  ]);
  const latest = historyResult.data?.[0];
  const relation = latest?.materials;
  const latestMaterial = Array.isArray(relation) ? relation[0] : relation;
  return <StudentHome name={displayName} grades={gradeCards} lesson={parseLessonProgress(lessonResult.data)}
    answerCount={countResult.error ? null : countResult.count ?? 0}
    materialCount={historyResult.error ? null : new Set(historyResult.data?.map(row => row.material_id)).size}
    recent={latest ? { materialId: latest.material_id, title: latestMaterial?.title ?? "Lanjutkan latihanmu" } : null}
    coding={profile?.learning_track === "coding"}
    progressError={!!(lessonResult.error || countResult.error || historyResult.error)} />;
}
