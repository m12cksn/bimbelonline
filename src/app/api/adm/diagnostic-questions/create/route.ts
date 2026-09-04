import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import {
  diagnosticServiceClient,
  isDiagnosticCategory,
} from "@/lib/diagnosticQuestionStore";
import type { DiagnosticQuestion } from "@/lib/mathCheckup";

type Difficulty = DiagnosticQuestion["difficulty"];

type Payload = {
  gradeLevel?: number;
  skillLevel?: number;
  assessmentBand?: DiagnosticQuestion["assessmentBand"];
  category?: string;
  domain?: string;
  skill?: string;
  subskill?: string;
  prerequisiteSkill?: string;
  difficulty?: Difficulty;
  cognitiveType?: DiagnosticQuestion["cognitiveType"];
  recommendationKey?: string;
  misconceptionKey?: string | null;
  diagnosticWeight?: number;
  diagnosticVersion?: string;
  prompt?: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  sortOrder?: number | null;
  isActive?: boolean;
};

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "Unauthenticated" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return { ok: false as const, status: 403, error: "Forbidden" };
  return { ok: true as const };
}

function cleanPayload(body: Payload) {
  const gradeLevel = Number(body.gradeLevel);
  const skillLevel = Number(body.skillLevel ?? body.gradeLevel);
  const assessmentBand = body.assessmentBand ?? "core";
  const category = String(body.category ?? "");
  const domain = String(body.domain ?? body.category ?? "").trim();
  const skill = String(body.skill ?? "").trim();
  const subskill = String(body.subskill ?? "").trim();
  const prerequisiteSkill = String(body.prerequisiteSkill ?? "").trim();
  const difficulty = body.difficulty ?? "sedang";
  const cognitiveType = body.cognitiveType ?? "concept";
  const recommendationKey = String(body.recommendationKey ?? "").trim();
  const misconceptionKey = body.misconceptionKey ? String(body.misconceptionKey).trim() : null;
  const diagnosticWeight = Number(body.diagnosticWeight ?? 1);
  const diagnosticVersion = String(body.diagnosticVersion ?? "MATH_CHECKUP_V1").trim();
  const prompt = String(body.prompt ?? "").trim();
  const options = (body.options ?? []).map((item) => String(item).trim()).filter(Boolean);
  const correctAnswer = String(body.correctAnswer ?? "").trim();
  const explanation = String(body.explanation ?? "").trim();

  if (!Number.isInteger(gradeLevel) || gradeLevel < 1 || gradeLevel > 12) throw new Error("Kelas tidak valid.");
  if (!Number.isInteger(skillLevel) || skillLevel < 1 || skillLevel > 12) throw new Error("Skill level tidak valid.");
  if (!["foundation", "core", "stretch"].includes(assessmentBand)) throw new Error("Assessment band tidak valid.");
  if (!isDiagnosticCategory(category)) throw new Error("Kategori tidak valid.");
  if (!domain) throw new Error("Domain wajib diisi.");
  if (!skill) throw new Error("Skill wajib diisi.");
  if (!subskill) throw new Error("Subskill wajib diisi.");
  if (!["mudah", "sedang", "menantang"].includes(difficulty)) throw new Error("Kesulitan tidak valid.");
  if (!["fluency", "concept", "application", "reasoning"].includes(cognitiveType)) throw new Error("Cognitive type tidak valid.");
  if (!recommendationKey) throw new Error("Recommendation key wajib diisi.");
  if (!Number.isFinite(diagnosticWeight) || diagnosticWeight <= 0) throw new Error("Diagnostic weight tidak valid.");
  if (!diagnosticVersion) throw new Error("Diagnostic version wajib diisi.");
  if (!prompt) throw new Error("Teks soal wajib diisi.");
  if (options.length < 2) throw new Error("Minimal isi 2 opsi jawaban.");
  if (!correctAnswer || !options.includes(correctAnswer)) throw new Error("Jawaban benar harus ada di opsi.");

  return {
    gradeLevel,
    skillLevel,
    assessmentBand,
    category,
    domain,
    skill,
    subskill,
    prerequisiteSkill,
    difficulty,
    cognitiveType,
    recommendationKey,
    misconceptionKey,
    diagnosticWeight,
    diagnosticVersion,
    prompt,
    options,
    correctAnswer,
    explanation,
  };
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: admin.error }, { status: admin.status });

  let cleaned: ReturnType<typeof cleanPayload>;
  const body = (await req.json()) as Payload;
  try {
    cleaned = cleanPayload(body);
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 });
  }

  const supabase = diagnosticServiceClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Konfigurasi Supabase belum lengkap." }, { status: 500 });

  const { data: maxRows } = await supabase
    .from("diagnostic_questions")
    .select("sort_order")
    .eq("grade_level", cleaned.gradeLevel)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextSort = Number(body.sortOrder ?? maxRows?.[0]?.sort_order ?? 0) || 0;

  const { data, error } = await supabase
    .from("diagnostic_questions")
    .insert({
      id: `diag-${crypto.randomUUID()}`,
      grade_level: cleaned.gradeLevel,
      skill_level: cleaned.skillLevel,
      assessment_band: cleaned.assessmentBand,
      category: cleaned.category,
      domain: cleaned.domain,
      skill: cleaned.skill,
      subskill: cleaned.subskill,
      prerequisite_skill: cleaned.prerequisiteSkill,
      difficulty: cleaned.difficulty,
      cognitive_type: cleaned.cognitiveType,
      recommendation_key: cleaned.recommendationKey,
      misconception_key: cleaned.misconceptionKey,
      diagnostic_weight: cleaned.diagnosticWeight,
      diagnostic_version: cleaned.diagnosticVersion,
      prompt: cleaned.prompt,
      options: cleaned.options,
      correct_answer: cleaned.correctAnswer,
      explanation: cleaned.explanation,
      sort_order: body.sortOrder ?? nextSort + 1,
      is_active: body.isActive ?? true,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("diagnostic question create error", error);
    return NextResponse.json({ ok: false, error: "Gagal membuat soal diagnostic." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}
