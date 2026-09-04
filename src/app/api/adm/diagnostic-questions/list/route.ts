import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import {
  diagnosticServiceClient,
  rowToDiagnosticQuestion,
  seedDiagnosticQuestions,
} from "@/lib/diagnosticQuestionStore";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false as const, status: 401, error: "Unauthenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }

  return { ok: true as const };
}

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ ok: false, error: admin.error }, { status: admin.status });
  }

  const url = new URL(req.url);
  const gradeLevel = Number(url.searchParams.get("gradeLevel") ?? 1);
  if (!Number.isInteger(gradeLevel) || gradeLevel < 1 || gradeLevel > 12) {
    return NextResponse.json({ ok: false, error: "Kelas tidak valid" }, { status: 400 });
  }

  const supabase = diagnosticServiceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Konfigurasi Supabase belum lengkap." }, { status: 500 });
  }

  let { data, error } = await supabase
    .from("diagnostic_questions")
    .select("id, grade_level, skill_level, assessment_band, category, domain, skill, subskill, prerequisite_skill, difficulty, cognitive_type, recommendation_key, misconception_key, diagnostic_weight, diagnostic_version, prompt, options, correct_answer, explanation, sort_order, is_active")
    .eq("grade_level", gradeLevel)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("diagnostic questions list error", error);
    return NextResponse.json(
      { ok: false, error: "Gagal memuat soal diagnostic. Pastikan migrasi database sudah dijalankan." },
      { status: 500 },
    );
  }

  if (!data || data.length === 0) {
    const seeded = await seedDiagnosticQuestions(supabase, gradeLevel);
    if (seeded.error) {
      console.error("diagnostic questions seed error", seeded.error);
      return NextResponse.json({ ok: false, error: "Gagal mengisi soal default." }, { status: 500 });
    }

    const retry = await supabase
      .from("diagnostic_questions")
      .select("id, grade_level, skill_level, assessment_band, category, domain, skill, subskill, prerequisite_skill, difficulty, cognitive_type, recommendation_key, misconception_key, diagnostic_weight, diagnostic_version, prompt, options, correct_answer, explanation, sort_order, is_active")
      .eq("grade_level", gradeLevel)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    return NextResponse.json({ ok: false, error: "Gagal memuat soal diagnostic." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    questions: (data ?? []).map((row) => ({
      ...rowToDiagnosticQuestion(row as any),
      sortOrder: row.sort_order,
      isActive: row.is_active ?? true,
    })),
  });
}
