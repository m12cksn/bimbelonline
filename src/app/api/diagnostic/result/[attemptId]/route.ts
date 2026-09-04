import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import {
  diagnosticCategories,
  getScoreProfile,
  type DiagnosticQuestion,
} from "@/lib/mathCheckup";

import { getDiagnosticQuestionMapFromDb } from "@/lib/diagnosticQuestionStore";

type Params = {
  params: Promise<{
    attemptId: string;
  }>;
};

type Band = "foundation" | "core" | "stretch";

type SkillStatus =
  | "strong"
  | "secure"
  | "developing"
  | "needs_review"
  | "priority_gap";

type ReadinessStatus =
  | "foundation_support_needed"
  | "developing_at_grade_level"
  | "secure_at_grade_level"
  | "ready_for_enrichment";

type AnswerRow = {
  question_id: string;
  selected_answer: string | null;
  correct_answer: string;
  category: string;
  difficulty: string;
  is_correct: boolean;
};

type SkillAccumulator = {
  skill: string;
  domain: string;
  subskills: Set<string>;

  correct: number;
  total: number;

  incorrectQuestionIds: string[];

  recommendationKeys: Set<string>;
  prerequisiteSkills: Set<string>;

  bands: Set<Band>;
};

type SkillResult = {
  skill: string;
  domain: string;
  subskills: string[];

  score: number;
  correct: number;
  total: number;

  status: SkillStatus;

  confidence: "low" | "medium" | "high";

  recommendationKeys: string[];
  prerequisiteSkills: string[];

  bands: Band[];
};

type RootGap = {
  skill: string;
  affects: string[];
  confidence: "medium" | "high";
};

const grade1RecommendationTitles: Record<string, string> = {
  G1_COUNTING_CARDINALITY: "Menghitung dan Menentukan Banyak Benda",

  G1_NUMBER_REPRESENTATION: "Mengenal Lambang Bilangan",

  G1_NUMBER_MAGNITUDE: "Membandingkan Banyak Benda dan Bilangan",

  G1_NUMBER_COMPOSITION: "Menyusun dan Mengurai Bilangan",

  G1_PLACE_VALUE: "Nilai Tempat",

  G1_BASIC_ADDITION: "Penjumlahan Dasar",

  G1_BASIC_SUBTRACTION: "Pengurangan Dasar",

  G1_MISSING_ADDEND: "Pasangan Bilangan dan Angka yang Hilang",

  G1_EQUALITY: "Kesetaraan dan Hubungan Bilangan",

  G1_WORD_PROBLEM: "Memahami Soal Cerita",

  G1_PATTERN: "Pola",

  G1_MEASUREMENT: "Pengukuran",

  G1_SHAPE_ATTRIBUTES: "Ciri-Ciri Bangun",

  G1_SPATIAL_POSITION: "Posisi Benda",

  G1_FRACTION_FOUNDATION: "Dasar Pecahan",

  G1_DATA_INTERPRETATION: "Membaca Data Sederhana",
};

/* =========================================================
 * SUPABASE
 * ======================================================= */

function serviceClient() {
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
 * GENERAL HELPERS
 * ======================================================= */

function clampPercentage(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function percentage(correct: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return clampPercentage((correct / total) * 100);
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

/* =========================================================
 * BAND SCORES
 * ======================================================= */

function calculateBandScores(
  answers: AnswerRow[],
  questionMap: Map<string, DiagnosticQuestion>,
) {
  const accumulator: Record<
    Band,
    {
      correct: number;
      total: number;
    }
  > = {
    foundation: {
      correct: 0,
      total: 0,
    },

    core: {
      correct: 0,
      total: 0,
    },

    stretch: {
      correct: 0,
      total: 0,
    },
  };

  for (const answer of answers) {
    const question = questionMap.get(answer.question_id);

    if (!question) {
      continue;
    }

    const band = question.assessmentBand;

    accumulator[band].total += 1;

    if (answer.is_correct) {
      accumulator[band].correct += 1;
    }
  }

  return {
    foundation: {
      ...accumulator.foundation,

      score: percentage(
        accumulator.foundation.correct,
        accumulator.foundation.total,
      ),
    },

    core: {
      ...accumulator.core,

      score: percentage(accumulator.core.correct, accumulator.core.total),
    },

    stretch: {
      ...accumulator.stretch,

      score: percentage(accumulator.stretch.correct, accumulator.stretch.total),
    },
  };
}

/* =========================================================
 * READINESS
 * ======================================================= */

function calculateReadinessScore(
  foundationScore: number,
  coreScore: number,
  stretchScore: number,
) {
  return clampPercentage(
    foundationScore * 0.3 + coreScore * 0.6 + stretchScore * 0.1,
  );
}

function getReadinessStatus({
  foundationScore,
  coreScore,
  stretchScore,
  hasMajorPriorityGap,
}: {
  foundationScore: number;
  coreScore: number;
  stretchScore: number;
  hasMajorPriorityGap: boolean;
}): ReadinessStatus {
  /*
   * INTERNAL V1 HEURISTICS
   *
   * Threshold ini bukan standardized norm.
   * Nanti dikalibrasi setelah kita punya
   * data diagnostic real.
   */

  if (foundationScore < 67) {
    return "foundation_support_needed";
  }

  if (
    foundationScore >= 83 &&
    coreScore >= 83 &&
    stretchScore >= 67 &&
    !hasMajorPriorityGap
  ) {
    return "ready_for_enrichment";
  }

  if (foundationScore >= 83 && coreScore >= 75 && !hasMajorPriorityGap) {
    return "secure_at_grade_level";
  }

  return "developing_at_grade_level";
}

function readinessLabel(status: ReadinessStatus) {
  const labels: Record<ReadinessStatus, string> = {
    foundation_support_needed: "Perlu Penguatan Dasar",

    developing_at_grade_level: "Mulai Berkembang Sesuai Kelas",

    secure_at_grade_level: "Kuat Sesuai Kelas",

    ready_for_enrichment: "Ready for Enrichment",
  };

  return labels[status];
}

/* =========================================================
 * SKILL ANALYSIS
 * ======================================================= */

function confidenceFromEvidence(total: number) {
  if (total >= 3) {
    return "high" as const;
  }

  if (total >= 2) {
    return "medium" as const;
  }

  return "low" as const;
}

function determineSkillStatus({
  score,
  correct,
  total,
}: {
  score: number;
  correct: number;
  total: number;
}): SkillStatus {
  /*
   * Jangan mendiagnosis weakness
   * dari hanya satu evidence.
   */

  if (total === 1) {
    if (correct === 1) {
      return "secure";
    }

    return "needs_review";
  }

  const incorrect = total - correct;

  /*
   * >= 2 kesalahan pada skill yang sama
   * menjadi Priority Gap.
   */
  if (incorrect >= 2) {
    return "priority_gap";
  }

  if (score >= 85) {
    return "strong";
  }

  if (score >= 70) {
    return "secure";
  }

  if (score >= 50) {
    return "developing";
  }

  return "needs_review";
}

function calculateSkillResults(
  answers: AnswerRow[],
  questionMap: Map<string, DiagnosticQuestion>,
): SkillResult[] {
  const map = new Map<string, SkillAccumulator>();

  for (const answer of answers) {
    const question = questionMap.get(answer.question_id);

    if (!question) {
      continue;
    }

    const skill = question.skill || question.domain || question.category;

    const current = map.get(skill) ?? {
      skill,

      domain: question.domain,

      subskills: new Set<string>(),

      correct: 0,
      total: 0,

      incorrectQuestionIds: [],

      recommendationKeys: new Set<string>(),

      prerequisiteSkills: new Set<string>(),

      bands: new Set<Band>(),
    };

    current.total += 1;

    if (answer.is_correct) {
      current.correct += 1;
    } else {
      current.incorrectQuestionIds.push(answer.question_id);
    }

    if (question.subskill) {
      current.subskills.add(question.subskill);
    }

    if (question.recommendationKey) {
      current.recommendationKeys.add(question.recommendationKey);
    }

    if (question.prerequisiteSkill) {
      current.prerequisiteSkills.add(question.prerequisiteSkill);
    }

    current.bands.add(question.assessmentBand);

    map.set(skill, current);
  }

  return Array.from(map.values()).map((item) => {
    const score = percentage(item.correct, item.total);

    return {
      skill: item.skill,

      domain: item.domain,

      subskills: [...item.subskills],

      score,

      correct: item.correct,

      total: item.total,

      status: determineSkillStatus({
        score,

        correct: item.correct,

        total: item.total,
      }),

      confidence: confidenceFromEvidence(item.total),

      recommendationKeys: [...item.recommendationKeys],

      prerequisiteSkills: [...item.prerequisiteSkills],

      bands: [...item.bands],
    };
  });
}

/* =========================================================
 * ROOT GAP ANALYSIS
 * ======================================================= */

function calculateRootGaps(skillResults: SkillResult[]): RootGap[] {
  const skillByName = new Map(
    skillResults.map((skill) => [skill.skill, skill]),
  );

  const rootGapMap = new Map<string, Set<string>>();

  /*
   * Jika:
   *
   * - sebuah skill bermasalah
   * - dan prerequisite-nya juga bermasalah
   *
   * maka prerequisite tersebut menjadi
   * kandidat root gap.
   */
  for (const skillResult of skillResults) {
    const childHasGap =
      skillResult.status === "priority_gap" ||
      skillResult.status === "developing" ||
      skillResult.status === "needs_review";

    if (!childHasGap) {
      continue;
    }

    for (const prerequisite of skillResult.prerequisiteSkills) {
      const prerequisiteResult = skillByName.get(prerequisite);

      if (!prerequisiteResult) {
        continue;
      }

      const prerequisiteHasGap =
        prerequisiteResult.status === "priority_gap" ||
        prerequisiteResult.status === "developing" ||
        prerequisiteResult.status === "needs_review";

      if (!prerequisiteHasGap) {
        continue;
      }

      const affected = rootGapMap.get(prerequisite) ?? new Set<string>();

      affected.add(skillResult.skill);

      rootGapMap.set(prerequisite, affected);
    }
  }

  return Array.from(rootGapMap.entries()).map(([skill, affects]) => ({
    skill,

    affects: [...affects],

    confidence: affects.size >= 2 ? "high" : "medium",
  }));
}

/* =========================================================
 * RECOMMENDATION
 * ======================================================= */

function recommendationTitle(key: string) {
  return (
    grade1RecommendationTitles[key] ??
    key
      .replace(/^G\d+_/, "")
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (character) => character.toUpperCase())
  );
}

function getPriorityOrder(skill: SkillResult) {
  /*
   * Priority Gap paling dahulu.
   *
   * Foundation juga harus muncul
   * sebelum Core/Stretch.
   */

  const statusWeight: Record<SkillStatus, number> = {
    priority_gap: 0,
    needs_review: 1,
    developing: 2,
    secure: 3,
    strong: 4,
  };

  const bandWeight = skill.bands.includes("foundation")
    ? 0
    : skill.bands.includes("core")
      ? 1
      : 2;

  return statusWeight[skill.status] * 10 + bandWeight;
}

function buildLearningPlan(skillResults: SkillResult[], rootGaps: RootGap[]) {
  const problematic = skillResults
    .filter(
      (item) =>
        item.status === "priority_gap" ||
        item.status === "needs_review" ||
        item.status === "developing",
    )
    .sort((a, b) => getPriorityOrder(a) - getPriorityOrder(b));

  /*
   * Root gap selalu diprioritaskan.
   */
  const rootGapNames = rootGaps.map((item) => item.skill);

  const recommendationKeys = unique(
    problematic.flatMap((item) => item.recommendationKeys),
  );

  const learningPath = unique([
    ...rootGapNames,

    ...problematic.map((item) => item.skill),
  ]).slice(0, 5);

  const firstRecommendationKey = recommendationKeys[0] ?? null;

  const startingPoint = firstRecommendationKey
    ? {
        key: firstRecommendationKey,

        title: recommendationTitle(firstRecommendationKey),
      }
    : {
        key: "GRADE_LEVEL_PRACTICE",

        title: "Latihan Sesuai Kelas",
      };

  return {
    recommendedStartingPoint: startingPoint,

    learningPath,

    recommendationKeys,

    trialFocus:
      learningPath.length > 0
        ? learningPath.slice(0, 2).join(" & ")
        : "Matematika Sesuai Kelas",
  };
}

/* =========================================================
 * NARRATIVE
 * ======================================================= */

function buildDiagnosticNarrative({
  studentName,
  status,
  strengths,
  priorityGaps,
  rootGaps,
}: {
  studentName: string;
  status: ReadinessStatus;
  strengths: SkillResult[];
  priorityGaps: SkillResult[];
  rootGaps: RootGap[];
}) {
  const firstName = studentName.trim().split(/\s+/)[0] || "Anak";

  const strengthText =
    strengths.length > 0
      ? strengths
          .slice(0, 2)
          .map((item) => item.skill)
          .join(" dan ")
      : null;

  const priorityText =
    priorityGaps.length > 0
      ? priorityGaps
          .slice(0, 2)
          .map((item) => item.skill)
          .join(" dan ")
      : null;

  const rootText = rootGaps.length > 0 ? rootGaps[0].skill : null;

  if (status === "ready_for_enrichment") {
    return `${firstName} menunjukkan fondasi dan kemampuan matematika kelas 1 yang kuat. ${
      strengthText
        ? `Kekuatan yang paling terlihat berada pada ${strengthText}. `
        : ""
    }Hasil ini menunjukkan anak sudah siap mendapatkan variasi soal yang lebih menantang sambil tetap menjaga ketelitian dan cara menjelaskan proses berpikir.`;
  }

  if (status === "secure_at_grade_level") {
    return `${firstName} menunjukkan kesiapan yang baik terhadap materi matematika kelas 1. ${
      strengthText
        ? `Kemampuan yang sudah cukup kuat terlihat pada ${strengthText}. `
        : ""
    }Masih ada beberapa area yang dapat dibuat lebih konsisten sebelum masuk ke tantangan yang lebih tinggi.`;
  }

  if (status === "foundation_support_needed") {
    return `${firstName} membutuhkan penguatan pada beberapa kemampuan fondasi sebelum materi kelas 1 dilanjutkan lebih jauh. ${
      rootText
        ? `Analisis menunjukkan ${rootText} menjadi salah satu kemampuan dasar yang perlu diperkuat terlebih dahulu. `
        : ""
    }Penguatan sebaiknya dilakukan secara bertahap dari konsep dasar menuju soal yang lebih kompleks.`;
  }

  return `${firstName} sudah memiliki sebagian kemampuan matematika kelas 1, tetapi beberapa konsep belum stabil. ${
    strengthText
      ? `Kekuatan yang dapat dijadikan pijakan terlihat pada ${strengthText}. `
      : ""
  }${
    priorityText ? `Fokus penguatan berikutnya adalah ${priorityText}. ` : ""
  }Latihan sebaiknya mengikuti urutan konsep yang jelas agar anak tidak hanya mampu menjawab soal langsung, tetapi juga memahami hubungan antarangka dan menerapkannya pada bentuk soal yang berbeda.`;
}

/* =========================================================
 * LEGACY CATEGORY SCORE
 * ======================================================= */

function buildLegacyCategoryScores(answers: AnswerRow[]) {
  return diagnosticCategories.map((category) => {
    const rows = answers.filter((answer) => answer.category === category);

    const correct = rows.filter((answer) => answer.is_correct).length;

    return {
      category,

      score: percentage(correct, rows.length),

      correct,

      total: rows.length,
    };
  });
}

/* =========================================================
 * ROUTE
 * ======================================================= */

export async function GET(_req: Request, props: Params) {
  const { attemptId } = await props.params;

  const supabase = serviceClient();

  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,

        error: "Konfigurasi Supabase belum lengkap.",
      },
      {
        status: 500,
      },
    );
  }

  const { data: attempt, error } = await supabase
    .from("diagnostic_attempts")
    .select(
      `
        id,
        student_name,
        parent_whatsapp,
        grade_level,
        concern,
        score,
        result_level,
        category_scores,
        created_at,
        completed_at
      `,
    )
    .eq("id", attemptId)
    .single();

  if (error || !attempt) {
    return NextResponse.json(
      {
        ok: false,

        error: "Hasil check-up tidak ditemukan.",
      },
      {
        status: 404,
      },
    );
  }

  const { data: answerRows, error: answerError } = await supabase
    .from("diagnostic_answers")
    .select(
      `
        question_id,
        selected_answer,
        correct_answer,
        category,
        difficulty,
        is_correct
      `,
    )
    .eq("attempt_id", attemptId);

  if (answerError) {
    console.error("diagnostic result answers error", answerError);

    return NextResponse.json(
      {
        ok: false,

        error: "Jawaban diagnostic tidak dapat dimuat.",
      },
      {
        status: 500,
      },
    );
  }

  const questionMap = await getDiagnosticQuestionMapFromDb(attempt.grade_level);

  const rawAnswers = (answerRows ?? []) as AnswerRow[];

  /*
   * Sort sesuai urutan question bank.
   */
  const questionOrder = new Map(
    Array.from(questionMap.keys()).map((questionId, index) => [
      questionId,
      index,
    ]),
  );

  const sortedAnswers = [...rawAnswers].sort(
    (a, b) =>
      (questionOrder.get(a.question_id) ?? 999) -
      (questionOrder.get(b.question_id) ?? 999),
  );

  /* =======================================================
   * ANSWERS WITH METADATA
   * ===================================================== */

  const answers = sortedAnswers.map((row) => {
    const question = questionMap.get(row.question_id);

    return {
      ...row,

      prompt: question?.prompt ?? row.question_id,

      explanation: question?.explanation ?? "",

      assessmentBand: question?.assessmentBand ?? "core",

      domain: question?.domain ?? row.category,

      skill: question?.skill ?? row.category,

      subskill: question?.subskill ?? "",

      prerequisiteSkill: question?.prerequisiteSkill ?? "",

      cognitiveType: question?.cognitiveType ?? "concept",

      recommendationKey: question?.recommendationKey ?? "",

      misconceptionKey: question?.misconceptionKey ?? null,

      diagnosticVersion: question?.diagnosticVersion ?? null,
    };
  });

  /* =======================================================
   * V2 ENGINE
   * ===================================================== */

  const bandScores = calculateBandScores(sortedAnswers, questionMap);

  const skillResults = calculateSkillResults(sortedAnswers, questionMap);

  const strengths = skillResults.filter(
    (item) => item.status === "strong" || item.status === "secure",
  );

  const priorityGaps = skillResults.filter(
    (item) => item.status === "priority_gap",
  );

  const needsReview = skillResults.filter(
    (item) => item.status === "needs_review" || item.status === "developing",
  );

  const rootGaps = calculateRootGaps(skillResults);

  const readinessScore = calculateReadinessScore(
    bandScores.foundation.score,
    bandScores.core.score,
    bandScores.stretch.score,
  );

  const readinessStatus = getReadinessStatus({
    foundationScore: bandScores.foundation.score,

    coreScore: bandScores.core.score,

    stretchScore: bandScores.stretch.score,

    hasMajorPriorityGap: priorityGaps.length > 0,
  });

  const learningPlan = buildLearningPlan(skillResults, rootGaps);

  const narrative = buildDiagnosticNarrative({
    studentName: attempt.student_name,

    status: readinessStatus,

    strengths,

    priorityGaps,

    rootGaps,
  });

  /*
   * Legacy values sementara.
   *
   * result_client lama masih membutuhkannya
   * sampai UI V2 selesai.
   */
  const legacyScore = Number(attempt.score ?? 0);

  const profile = getScoreProfile(legacyScore);

  const categoryScores = buildLegacyCategoryScores(sortedAnswers);

  return NextResponse.json({
    ok: true,

    /* ===============================================
     * ATTEMPT
     * ============================================= */

    attempt: {
      ...attempt,

      /*
       * score database lama tidak kita ubah dulu.
       *
       * UI V2 nanti harus menggunakan
       * diagnostic.readinessScore.
       */
    },

    /* ===============================================
     * DIAGNOSTIC V2
     * ============================================= */

    diagnostic: {
      version:
        answers.find((answer) => answer.diagnosticVersion)?.diagnosticVersion ??
        `BSMATH_G${attempt.grade_level}_V1`,

      readinessScore,

      readinessStatus,

      readinessLabel: readinessLabel(readinessStatus),

      bandScores,

      skillResults,

      strengths,

      needsReview,

      priorityGaps,

      rootGaps,

      recommendedStartingPoint: learningPlan.recommendedStartingPoint,

      learningPath: learningPlan.learningPath,

      recommendationKeys: learningPlan.recommendationKeys,

      trialFocus: learningPlan.trialFocus,

      narrative,
    },

    /* ===============================================
     * ANSWER HISTORY
     * ============================================= */

    answers,

    /* ===============================================
     * LEGACY
     *
     * Akan kita hapus setelah result_client V2
     * benar-benar selesai.
     * ============================================= */

    profile,

    categoryScores,
  });
}
