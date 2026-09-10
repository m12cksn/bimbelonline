import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { diagnosticCategories, getScoreProfile } from "@/lib/mathCheckup";

import { getDiagnosticQuestionsByIdsFromDb } from "@/lib/diagnosticQuestionStore";

type Params = {
  params: Promise<{
    attemptId: string;
  }>;
};

type ReadinessKey = "below" | "approaching" | "on_grade" | "above";

type SkillStatusKey = "mastered" | "secure" | "developing" | "priority_gap";

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

function normalizeQuestionIds(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function normalizeAnswer(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function weightedScore(
  rows: Array<{
    is_correct: boolean;
    weight: number;
  }>,
) {
  const totalWeight = rows.reduce((sum, row) => sum + row.weight, 0);

  if (totalWeight <= 0) {
    return 0;
  }

  const correctWeight = rows.reduce(
    (sum, row) => sum + (row.is_correct ? row.weight : 0),
    0,
  );

  return Math.round((correctWeight / totalWeight) * 100);
}

function diagnosticQuestionWeight(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function getSkillStatus(score: number): {
  key: SkillStatusKey;
  label: string;
} {
  if (score >= 85) {
    return {
      key: "mastered",
      label: "Sangat Dikuasai",
    };
  }

  if (score >= 70) {
    return {
      key: "secure",
      label: "Dikuasai",
    };
  }

  if (score >= 50) {
    return {
      key: "developing",
      label: "Sedang Berkembang",
    };
  }

  return {
    key: "priority_gap",
    label: "Perlu Diprioritaskan",
  };
}

function getAssessmentBandLabel(band: string) {
  if (band === "foundation") {
    return "Fondasi";
  }

  if (band === "stretch") {
    return "Tantangan";
  }

  return "Level Kelas";
}

function getReadinessLabel(readiness: ReadinessKey) {
  switch (readiness) {
    case "below":
      return "Perlu Memperkuat Fondasi";

    case "approaching":
      return "Mendekati Kesiapan Level Kelas";

    case "above":
      return "Siap Menghadapi Tantangan Lebih Tinggi";

    default:
      return "Siap di Level Kelas Saat Ini";
  }
}

export async function POST(req: Request, props: Params) {
  const { attemptId } = await props.params;

  const body = (await req.json()) as {
    answers?: Record<string, string>;
  };

  const answers = body.answers ?? {};

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

  const { data: attempt, error: attemptError } = await supabase
    .from("diagnostic_attempts")
    .select("id, grade_level, question_ids")
    .eq("id", attemptId)
    .single();

  if (attemptError || !attempt) {
    return NextResponse.json(
      {
        ok: false,
        error: "Data check-up tidak ditemukan.",
      },
      {
        status: 404,
      },
    );
  }

  const questions = await getDiagnosticQuestionsByIdsFromDb(
    attempt.grade_level,
    normalizeQuestionIds(attempt.question_ids),
  );

  if (questions.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "Soal diagnostic tidak tersedia.",
      },
      {
        status: 404,
      },
    );
  }

  /*
   * Metadata skill, domain, assessment band, dan prerequisite
   * digunakan untuk analisis diagnostic.
   *
   * Metadata tambahan ini TIDAK langsung dimasukkan ke tabel
   * diagnostic_answers sehingga file ini tetap kompatibel
   * dengan struktur database lama.
   */
  const rows = questions.map((question) => {
    const selectedAnswer = String(answers[question.id] ?? "").trim();

    const correctAnswer = String(question.correctAnswer ?? "").trim();

    const isCorrect =
      normalizeAnswer(selectedAnswer) === normalizeAnswer(correctAnswer);

    return {
      attempt_id: attemptId,
      question_id: question.id,

      category: question.category,

      domain: question.domain,
      skill: question.skill,
      subskill: question.subskill,

      prerequisite_skill: question.prerequisiteSkill || null,

      assessment_band: question.assessmentBand,

      skill_level: question.skillLevel,

      difficulty: question.difficulty,

      cognitive_type: question.cognitiveType,

      recommendation_key: question.recommendationKey,

      misconception_key: question.misconceptionKey,

      selected_answer: selectedAnswer || null,

      correct_answer: correctAnswer,

      is_correct: isCorrect,

      weight: diagnosticQuestionWeight(question.diagnosticWeight),
    };
  });

  /*
   * Skor keseluruhan.
   */
  const score = weightedScore(rows);
  const profile = getScoreProfile(score);

  /*
   * Skor per kategori lama.
   * Tetap dipertahankan agar result page lama tidak rusak.
   */
  const categoryScores = diagnosticCategories.map((category) => {
    const categoryRows = rows.filter((row) => row.category === category);

    const correct = categoryRows.filter((row) => row.is_correct).length;

    const totalWeight = categoryRows.reduce((sum, row) => sum + row.weight, 0);

    const correctWeight = categoryRows.reduce(
      (sum, row) => sum + (row.is_correct ? row.weight : 0),
      0,
    );

    return {
      category,
      total: categoryRows.length,
      correct,
      score:
        totalWeight > 0 ? Math.round((correctWeight / totalWeight) * 100) : 0,
    };
  });

  /*
   * Analisis Fondasi / Level Kelas / Tantangan.
   */
  const assessmentBands = ["foundation", "core", "stretch"] as const;

  const assessmentBandScores = assessmentBands.map((band) => {
    const bandRows = rows.filter((row) => row.assessment_band === band);

    const totalWeight = bandRows.reduce((sum, row) => sum + row.weight, 0);

    const correctWeight = bandRows.reduce(
      (sum, row) => sum + (row.is_correct ? row.weight : 0),
      0,
    );

    return {
      band,
      label: getAssessmentBandLabel(band),
      total: bandRows.length,
      correct: bandRows.filter((row) => row.is_correct).length,
      score:
        totalWeight > 0
          ? Math.round((correctWeight / totalWeight) * 100)
          : null,
    };
  });

  /*
   * Analisis per skill.
   */
  const skillNames = [
    ...new Set(
      rows
        .map((row) => row.skill)
        .filter((value): value is string => Boolean(value)),
    ),
  ];

  const skillScores = skillNames.map((skill) => {
    const skillRows = rows.filter((row) => row.skill === skill);

    const totalWeight = skillRows.reduce((sum, row) => sum + row.weight, 0);

    const correctWeight = skillRows.reduce(
      (sum, row) => sum + (row.is_correct ? row.weight : 0),
      0,
    );

    const skillScore =
      totalWeight > 0 ? Math.round((correctWeight / totalWeight) * 100) : 0;

    const status = getSkillStatus(skillScore);

    return {
      skill,

      domain: skillRows[0]?.domain ?? "",

      subskill: skillRows[0]?.subskill ?? "",

      prerequisiteSkill: skillRows[0]?.prerequisite_skill ?? null,

      total: skillRows.length,

      correct: skillRows.filter((row) => row.is_correct).length,

      score: skillScore,

      status: status.key,
      statusLabel: status.label,
    };
  });

  /*
   * Kesiapan siswa.
   */
  const foundationScore =
    assessmentBandScores.find((item) => item.band === "foundation")?.score ??
    null;

  const coreScore =
    assessmentBandScores.find((item) => item.band === "core")?.score ?? null;

  const stretchScore =
    assessmentBandScores.find((item) => item.band === "stretch")?.score ?? null;

  let readiness: ReadinessKey;

  if (foundationScore !== null && foundationScore < 60) {
    readiness = "below";
  } else if (coreScore !== null && coreScore < 70) {
    readiness = "approaching";
  } else if (
    coreScore !== null &&
    coreScore >= 70 &&
    stretchScore !== null &&
    stretchScore >= 70
  ) {
    readiness = "above";
  } else {
    readiness = "on_grade";
  }

  const readinessLabel = getReadinessLabel(readiness);

  /*
   * Priority gap sementara:
   * mengambil maksimal 3 skill terlemah.
   */
  const priorityGaps = skillScores
    .filter(
      (item) => item.status === "priority_gap" || item.status === "developing",
    )
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  /*
   * Penyimpanan jawaban tetap memakai struktur database lama.
   * Jangan menambah kolom baru di sini sebelum migration Supabase dibuat.
   */
  const rowsForInsert = rows.map((row) => ({
    attempt_id: row.attempt_id,

    question_id: row.question_id,

    category: row.category,

    difficulty: row.difficulty,

    selected_answer: row.selected_answer,

    correct_answer: row.correct_answer,

    is_correct: row.is_correct,
  }));

  await supabase
    .from("diagnostic_answers")
    .delete()
    .eq("attempt_id", attemptId);

  const { error: answerError } = rowsForInsert.length
    ? await supabase.from("diagnostic_answers").insert(rowsForInsert)
    : {
        error: null,
      };

  if (answerError) {
    console.error("diagnostic answer insert error", answerError);

    return NextResponse.json(
      {
        ok: false,
        error: "Gagal menyimpan jawaban.",
      },
      {
        status: 500,
      },
    );
  }

  /*
   * Update database lama tetap dipertahankan.
   *
   * skillScores, assessmentBandScores, readiness, dan priorityGaps
   * BELUM disimpan ke Supabase agar tidak menimbulkan error kolom.
   * Untuk sekarang analisis tersebut dikirim lewat response API.
   */
  const { error: updateError } = await supabase
    .from("diagnostic_attempts")
    .update({
      status: "completed",
      score,
      result_level: profile.level,
      category_scores: categoryScores,
      completed_at: new Date().toISOString(),
    })
    .eq("id", attemptId);

  if (updateError) {
    console.error("diagnostic attempt update error", updateError);

    return NextResponse.json(
      {
        ok: false,
        error: "Gagal menyimpan hasil.",
      },
      {
        status: 500,
      },
    );
  }

  return NextResponse.json({
    ok: true,
    attemptId,
    score,
    resultLevel: profile.level,

    analysis: {
      readiness,
      readinessLabel,
      assessmentBandScores,
      skillScores,
      priorityGaps,
    },
  });
}
