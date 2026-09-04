import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  diagnosticCategories,
  getDiagnosticQuestions,
  type DiagnosticCategory,
  type DiagnosticQuestion,
} from "@/lib/mathCheckup";

/* =========================================================
 * DATABASE ROW
 * ======================================================= */

type DiagnosticQuestionRow = {
  id: string;

  grade_level: number;
  skill_level: number | null;

  assessment_band: DiagnosticQuestion["assessmentBand"] | null;

  /*
   * category masih dipertahankan sementara
   * untuk compatibility dengan Diagnostic V1.
   */
  category: DiagnosticCategory;

  domain: string | null;
  skill: string | null;
  subskill: string | null;

  prerequisite_skill: string | null;

  difficulty: DiagnosticQuestion["difficulty"] | null;

  cognitive_type: DiagnosticQuestion["cognitiveType"] | null;

  recommendation_key: string | null;
  misconception_key: string | null;

  diagnostic_weight: number | null;
  diagnostic_version: string | null;

  prompt: string;

  options: string[] | unknown;

  correct_answer: string;

  explanation: string;

  sort_order: number | null;

  is_active: boolean | null;
};

/* =========================================================
 * SERVICE CLIENT
 * ======================================================= */

export function diagnosticServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!key || !url) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/* =========================================================
 * HELPERS
 * ======================================================= */

/**
 * Mengubah nama skill menjadi format key.
 *
 * Contoh:
 *
 * "Missing Number"
 * →
 * "MISSING_NUMBER"
 *
 * "Word Problem Modeling"
 * →
 * "WORD_PROBLEM_MODELING"
 */
function toKeyPart(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

/**
 * Recommendation fallback.
 *
 * Hanya dipakai untuk question lama yang belum memiliki
 * recommendation_key.
 *
 * Diagnostic V2 sebaiknya SELALU memiliki
 * recommendation_key eksplisit.
 */
function buildFallbackRecommendationKey(row: DiagnosticQuestionRow) {
  const source = row.skill ?? row.domain ?? row.category;

  return `G${row.grade_level}_${toKeyPart(source)}`;
}

/**
 * Diagnostic version fallback.
 *
 * Grade 1:
 * BSMATH_G1_V1
 *
 * Grade 5:
 * BSMATH_G5_V1
 */
function buildFallbackDiagnosticVersion(gradeLevel: number) {
  return `BSMATH_G${gradeLevel}_V1`;
}

/* =========================================================
 * DATABASE ROW → DOMAIN OBJECT
 * ======================================================= */

export function rowToDiagnosticQuestion(
  row: DiagnosticQuestionRow,
): DiagnosticQuestion {
  const options = Array.isArray(row.options)
    ? row.options.map((item) => String(item))
    : [];

  const domain = row.domain ?? row.category;

  const skill = row.skill ?? domain;

  const subskill = row.subskill ?? row.skill ?? "";

  return {
    id: row.id,

    gradeLevel: row.grade_level,

    /*
     * Jika question lama belum mempunyai skill_level,
     * anggap skill berada pada grade question tersebut.
     */
    skillLevel: row.skill_level ?? row.grade_level,

    /*
     * Question lama dianggap Core.
     */
    assessmentBand: row.assessment_band ?? "core",

    /*
     * Legacy category.
     *
     * Jangan dihapus dulu karena beberapa bagian
     * aplikasi lama masih menggunakannya.
     */
    category: row.category,

    domain,

    skill,

    subskill,

    prerequisiteSkill: row.prerequisite_skill ?? "",

    difficulty: row.difficulty ?? "sedang",

    cognitiveType: row.cognitive_type ?? "concept",

    /*
     * Diagnostic V2 seharusnya mengisi recommendation_key.
     *
     * Fallback hanya untuk compatibility soal lama.
     */
    recommendationKey:
      row.recommendation_key ?? buildFallbackRecommendationKey(row),

    misconceptionKey: row.misconception_key ?? null,

    diagnosticWeight: row.diagnostic_weight ?? 1,

    diagnosticVersion:
      row.diagnostic_version ?? buildFallbackDiagnosticVersion(row.grade_level),

    prompt: row.prompt,

    options,

    correctAnswer: row.correct_answer,

    explanation: row.explanation,
  };
}

/* =========================================================
 * STATIC QUESTION → DATABASE PAYLOAD
 * ======================================================= */

/**
 * Mengubah static question dari mathCheckup.ts
 * menjadi format row Supabase.
 *
 * Function ini masih diperlukan sementara
 * selama kita melakukan migrasi Grade 1 → Grade 12.
 */
export function staticQuestionRows(gradeLevel?: number) {
  const grades = gradeLevel
    ? [gradeLevel]
    : Array.from({ length: 12 }, (_, index) => index + 1);

  return grades.flatMap((grade) =>
    getDiagnosticQuestions(grade).map((question, index) => ({
      id: question.id,

      grade_level: question.gradeLevel,

      skill_level: question.skillLevel,

      assessment_band: question.assessmentBand,

      category: question.category,

      domain: question.domain,

      skill: question.skill,

      subskill: question.subskill,

      prerequisite_skill: question.prerequisiteSkill || null,

      difficulty: question.difficulty,

      cognitive_type: question.cognitiveType,

      recommendation_key: question.recommendationKey || null,

      misconception_key: question.misconceptionKey,

      diagnostic_weight: question.diagnosticWeight ?? 1,

      diagnostic_version:
        question.diagnosticVersion ||
        buildFallbackDiagnosticVersion(question.gradeLevel),

      prompt: question.prompt,

      options: question.options,

      correct_answer: question.correctAnswer,

      explanation: question.explanation,

      sort_order: index + 1,

      is_active: true,
    })),
  );
}

/* =========================================================
 * SEED QUESTIONS
 * ======================================================= */

/**
 * PERHATIAN:
 *
 * Function ini menghapus question pada grade yang dipilih
 * kemudian memasukkan ulang question dari mathCheckup.ts.
 *
 * Jangan menjalankan seed Grade 1 sebelum
 * 24 soal BSMATH_G1_V1 benar-benar selesai.
 */
export async function seedDiagnosticQuestions(
  supabase: SupabaseClient,
  gradeLevel?: number,
) {
  const payload = staticQuestionRows(gradeLevel);

  if (!payload.length) {
    return {
      error: null,
    };
  }

  const grades = gradeLevel
    ? [gradeLevel]
    : Array.from({ length: 12 }, (_, index) => index + 1);

  /*
   * Delete questions dari grade yang akan di-seed.
   */
  const deleteResult = await supabase
    .from("diagnostic_questions")
    .delete()
    .in("grade_level", grades);

  if (deleteResult.error) {
    return {
      error: deleteResult.error,
    };
  }

  /*
   * Insert question baru.
   */
  const { error } = await supabase.from("diagnostic_questions").insert(payload);

  return {
    error,
  };
}

/* =========================================================
 * GET QUESTIONS FROM DATABASE
 * ======================================================= */

export async function getDiagnosticQuestionsFromDb(gradeLevel: number) {
  const supabase = diagnosticServiceClient();

  /*
   * Jika Supabase service key tidak tersedia,
   * fallback ke static question.
   */
  if (!supabase) {
    return getDiagnosticQuestions(gradeLevel);
  }

  const { data, error } = await supabase
    .from("diagnostic_questions")
    .select(
      `
          id,
          grade_level,
          skill_level,
          assessment_band,
          category,
          domain,
          skill,
          subskill,
          prerequisite_skill,
          difficulty,
          cognitive_type,
          recommendation_key,
          misconception_key,
          diagnostic_weight,
          diagnostic_version,
          prompt,
          options,
          correct_answer,
          explanation,
          sort_order,
          is_active
        `,
    )
    .eq("grade_level", gradeLevel)
    .eq("is_active", true)
    .order("sort_order", {
      ascending: true,
    })
    .order("created_at", {
      ascending: true,
    });

  /*
   * Jika database error,
   * aplikasi tetap berjalan menggunakan
   * static questions.
   */
  if (error) {
    console.error("diagnostic question db read error", error);

    return getDiagnosticQuestions(gradeLevel);
  }

  /*
   * Jika database belum mempunyai question,
   * fallback ke static questions.
   */
  if (!data || data.length === 0) {
    return getDiagnosticQuestions(gradeLevel);
  }

  return data.map((row) =>
    rowToDiagnosticQuestion(row as DiagnosticQuestionRow),
  );
}

/* =========================================================
 * QUESTION MAP
 * ======================================================= */

/**
 * Digunakan terutama oleh submit API.
 *
 * Map membuat lookup question berdasarkan ID menjadi cepat:
 *
 * questionMap.get(questionId)
 */
export async function getDiagnosticQuestionMapFromDb(gradeLevel: number) {
  const questions = await getDiagnosticQuestionsFromDb(gradeLevel);

  return new Map(questions.map((question) => [question.id, question]));
}

/* =========================================================
 * LEGACY CATEGORY VALIDATION
 * ======================================================= */

export function isDiagnosticCategory(
  value: string,
): value is DiagnosticCategory {
  return diagnosticCategories.includes(value as DiagnosticCategory);
}
