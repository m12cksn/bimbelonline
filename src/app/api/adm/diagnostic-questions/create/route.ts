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
  category?: string;
  difficulty?: Difficulty;
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
  const category = String(body.category ?? "");
  const difficulty = body.difficulty ?? "sedang";
  const prompt = String(body.prompt ?? "").trim();
  const options = (body.options ?? []).map((item) => String(item).trim()).filter(Boolean);
  const correctAnswer = String(body.correctAnswer ?? "").trim();
  const explanation = String(body.explanation ?? "").trim();

  if (!Number.isInteger(gradeLevel) || gradeLevel < 1 || gradeLevel > 12) throw new Error("Kelas tidak valid.");
  if (!isDiagnosticCategory(category)) throw new Error("Kategori tidak valid.");
  if (!["mudah", "sedang", "menantang"].includes(difficulty)) throw new Error("Kesulitan tidak valid.");
  if (!prompt) throw new Error("Teks soal wajib diisi.");
  if (options.length < 2) throw new Error("Minimal isi 2 opsi jawaban.");
  if (!correctAnswer || !options.includes(correctAnswer)) throw new Error("Jawaban benar harus ada di opsi.");

  return { gradeLevel, category, difficulty, prompt, options, correctAnswer, explanation };
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
      category: cleaned.category,
      difficulty: cleaned.difficulty,
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
