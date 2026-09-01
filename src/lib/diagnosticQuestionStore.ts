import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  diagnosticCategories,
  getDiagnosticQuestions,
  type DiagnosticCategory,
  type DiagnosticQuestion,
} from "@/lib/mathCheckup";

type DiagnosticQuestionRow = {
  id: string;
  grade_level: number;
  category: DiagnosticCategory;
  difficulty: DiagnosticQuestion["difficulty"];
  prompt: string;
  options: string[] | unknown;
  correct_answer: string;
  explanation: string;
  sort_order: number | null;
  is_active: boolean | null;
};

export function diagnosticServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function rowToDiagnosticQuestion(row: DiagnosticQuestionRow): DiagnosticQuestion {
  const options = Array.isArray(row.options)
    ? row.options.map((item) => String(item))
    : [];

  return {
    id: row.id,
    gradeLevel: row.grade_level,
    category: row.category,
    difficulty: row.difficulty,
    prompt: row.prompt,
    options,
    correctAnswer: row.correct_answer,
    explanation: row.explanation,
  };
}

export function staticQuestionRows(gradeLevel?: number) {
  const grades = gradeLevel
    ? [gradeLevel]
    : Array.from({ length: 12 }, (_, index) => index + 1);

  return grades.flatMap((grade) =>
    getDiagnosticQuestions(grade).map((question, index) => ({
      id: question.id,
      grade_level: question.gradeLevel,
      category: question.category,
      difficulty: question.difficulty,
      prompt: question.prompt,
      options: question.options,
      correct_answer: question.correctAnswer,
      explanation: question.explanation,
      sort_order: index + 1,
      is_active: true,
    })),
  );
}

export async function seedDiagnosticQuestions(
  supabase: SupabaseClient,
  gradeLevel?: number,
) {
  const payload = staticQuestionRows(gradeLevel);
  if (!payload.length) return { error: null };

  const grades = gradeLevel
    ? [gradeLevel]
    : Array.from({ length: 12 }, (_, index) => index + 1);

  const deleteResult = await supabase
    .from("diagnostic_questions")
    .delete()
    .in("grade_level", grades);
  if (deleteResult.error) return { error: deleteResult.error };

  const { error } = await supabase.from("diagnostic_questions").insert(payload);

  return { error };
}

export async function getDiagnosticQuestionsFromDb(gradeLevel: number) {
  const supabase = diagnosticServiceClient();
  if (!supabase) return getDiagnosticQuestions(gradeLevel);

  const { data, error } = await supabase
    .from("diagnostic_questions")
    .select(
      "id, grade_level, category, difficulty, prompt, options, correct_answer, explanation, sort_order, is_active",
    )
    .eq("grade_level", gradeLevel)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("diagnostic question db read error", error);
    return getDiagnosticQuestions(gradeLevel);
  }

  if (!data || data.length === 0) return getDiagnosticQuestions(gradeLevel);

  return data.map((row) => rowToDiagnosticQuestion(row as DiagnosticQuestionRow));
}

export async function getDiagnosticQuestionMapFromDb(gradeLevel: number) {
  const questions = await getDiagnosticQuestionsFromDb(gradeLevel);
  return new Map(questions.map((question) => [question.id, question]));
}

export function isDiagnosticCategory(value: string): value is DiagnosticCategory {
  return diagnosticCategories.includes(value as DiagnosticCategory);
}
