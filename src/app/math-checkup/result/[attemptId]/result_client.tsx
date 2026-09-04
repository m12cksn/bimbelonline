"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import MathText from "@/app/components/MathText";

import { trackMetaCustomEvent } from "@/lib/meta-pixel";

/* =========================================================
 * TYPES
 * ======================================================= */

type ReadinessStatus =
  | "foundation_support_needed"
  | "developing_at_grade_level"
  | "secure_at_grade_level"
  | "ready_for_enrichment";

type SkillStatus =
  | "strong"
  | "secure"
  | "developing"
  | "needs_review"
  | "priority_gap";

type Confidence = "low" | "medium" | "high";

type BandScore = {
  score: number;
  correct: number;
  total: number;
};

type SkillResult = {
  skill: string;

  domain: string;

  subskills: string[];

  score: number;

  correct: number;

  total: number;

  status: SkillStatus;

  confidence: Confidence;

  recommendationKeys: string[];

  prerequisiteSkills: string[];

  bands: Array<"foundation" | "core" | "stretch">;
};

type RootGap = {
  skill: string;

  affects: string[];

  confidence: "medium" | "high";
};

type DiagnosticResult = {
  version: string;

  readinessScore: number;

  readinessStatus: ReadinessStatus;

  readinessLabel: string;

  bandScores: {
    foundation: BandScore;
    core: BandScore;
    stretch: BandScore;
  };

  skillResults: SkillResult[];

  strengths: SkillResult[];

  needsReview: SkillResult[];

  priorityGaps: SkillResult[];

  rootGaps: RootGap[];

  recommendedStartingPoint: {
    key: string;
    title: string;
  };

  learningPath: string[];

  recommendationKeys: string[];

  trialFocus: string;

  narrative: string;
};

type Attempt = {
  id: string;

  student_name: string;

  parent_whatsapp: string;

  grade_level: number;

  concern?: string | null;

  score: number;

  result_level: string;

  completed_at?: string | null;
};

type Answer = {
  question_id: string;

  prompt: string;

  selected_answer: string | null;

  correct_answer: string;

  category: string;

  difficulty: string;

  is_correct: boolean;

  explanation: string;

  assessmentBand: "foundation" | "core" | "stretch";

  domain: string;

  skill: string;

  subskill: string;

  prerequisiteSkill: string;

  cognitiveType: string;

  recommendationKey: string;

  misconceptionKey: string | null;

  diagnosticVersion: string | null;
};

/* =========================================================
 * HELPERS
 * ======================================================= */

function formatName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

function readinessText(status: ReadinessStatus) {
  const map: Record<ReadinessStatus, string> = {
    foundation_support_needed: "Fondasi Perlu Dikuatkan",

    developing_at_grade_level: "Sedang Berkembang",

    secure_at_grade_level: "Siap di Level Kelas",

    ready_for_enrichment: "Siap untuk Tantangan Lebih",
  };

  return map[status];
}

function readinessDescription(status: ReadinessStatus) {
  const map: Record<ReadinessStatus, string> = {
    foundation_support_needed:
      "Beberapa kemampuan dasar perlu diperkuat terlebih dahulu agar anak lebih siap mengikuti materi kelas.",

    developing_at_grade_level:
      "Sebagian kemampuan sudah terbentuk, tetapi masih ada konsep penting yang perlu dibuat lebih stabil.",

    secure_at_grade_level:
      "Fondasi dan kemampuan inti anak sudah cukup kuat untuk mengikuti materi matematika pada level kelasnya.",

    ready_for_enrichment:
      "Anak menunjukkan kesiapan yang kuat dan dapat mulai diberikan soal dengan penalaran serta tantangan yang lebih tinggi.",
  };

  return map[status];
}

function readinessClass(status: ReadinessStatus) {
  if (status === "ready_for_enrichment") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "secure_at_grade_level") {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }

  if (status === "developing_at_grade_level") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-rose-200 bg-rose-50 text-rose-800";
}

function skillStatusLabel(status: SkillStatus) {
  const map: Record<SkillStatus, string> = {
    strong: "Kuat",

    secure: "Dikuasai",

    developing: "Sedang Berkembang",

    needs_review: "Perlu Ditinjau",

    priority_gap: "Prioritas Penguatan",
  };

  return map[status];
}

function skillStatusClass(status: SkillStatus) {
  if (status === "strong") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "secure") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "priority_gap") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function confidenceLabel(confidence: Confidence) {
  if (confidence === "high") {
    return "Bukti kuat";
  }

  if (confidence === "medium") {
    return "Bukti cukup";
  }

  return "Perlu data tambahan";
}

function bandStatus(score: number, band: "foundation" | "core" | "stretch") {
  if (band === "stretch") {
    if (score >= 67) return "Kuat";

    if (score >= 34) return "Berkembang";

    return "Emerging";
  }

  if (score >= 83) return "Kuat";

  if (score >= 67) return "Cukup";

  return "Perlu Dikuatkan";
}

function bandDescription(band: "foundation" | "core" | "stretch") {
  if (band === "foundation") {
    return "Kemampuan dasar yang menopang materi kelas saat ini.";
  }

  if (band === "core") {
    return "Kemampuan utama yang diharapkan pada level kelas anak.";
  }

  return "Soal tantangan untuk melihat kesiapan menuju materi yang lebih tinggi.";
}

/* =========================================================
 * SCORE CIRCLE
 * ======================================================= */

function ScoreCircle({ score }: { score: number }) {
  const value = Math.max(0, Math.min(100, Number(score || 0)));

  const angle = value * 3.6;

  return (
    <div
      className="
        relative
        flex
        h-44
        w-44
        items-center
        justify-center
        rounded-full
        shadow-[0_20px_55px_-30px_rgba(15,23,42,0.45)]
        sm:h-52
        sm:w-52
      "
      style={{
        background: `conic-gradient(#16a34a ${angle}deg, #e2e8f0 0deg)`,
      }}
    >
      <div
        className="
          flex
          h-32
          w-32
          flex-col
          items-center
          justify-center
          rounded-full
          bg-white
          sm:h-40
          sm:w-40
        "
      >
        <span
          className="
            text-5xl
            font-black
            leading-none
            text-[#102449]
          "
        >
          {value}
        </span>

        <span
          className="
            mt-1
            text-sm
            font-black
            text-slate-400
          "
        >
          / 100
        </span>
      </div>
    </div>
  );
}

/* =========================================================
 * BAND CARD
 * ======================================================= */

function BandCard({
  title,
  band,
  data,
}: {
  title: string;

  band: "foundation" | "core" | "stretch";

  data: BandScore;
}) {
  return (
    <div
      className="
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm
      "
    >
      <div
        className="
          flex
          items-start
          justify-between
          gap-4
        "
      >
        <div>
          <p
            className="
              text-sm
              font-black
              text-[#102449]
            "
          >
            {title}
          </p>

          <p
            className="
              mt-1
              text-xs
              font-semibold
              leading-relaxed
              text-slate-500
            "
          >
            {bandDescription(band)}
          </p>
        </div>

        <span
          className="
            text-3xl
            font-black
            text-blue-700
          "
        >
          {data.score}%
        </span>
      </div>

      <div
        className="
          mt-5
          h-3
          overflow-hidden
          rounded-full
          bg-slate-100
        "
      >
        <div
          className="
            h-full
            rounded-full
            bg-gradient-to-r
            from-emerald-700
            via-emerald-500
            to-lime-300
          "
          style={{
            width: `${data.score}%`,
          }}
        />
      </div>

      <div
        className="
          mt-4
          flex
          items-center
          justify-between
          gap-3
        "
      >
        <span
          className="
            text-xs
            font-bold
            text-slate-500
          "
        >
          Benar {data.correct} dari {data.total}
        </span>

        <span
          className="
            border
            border-blue-100
            bg-blue-50
            px-3
            py-1
            text-xs
            font-black
            text-blue-700
          "
        >
          {bandStatus(data.score, band)}
        </span>
      </div>
    </div>
  );
}

/* =========================================================
 * COMPONENT
 * ======================================================= */

export default function MathCheckupResultClient({
  attemptId,
}: {
  attemptId: string;
}) {
  const [attempt, setAttempt] = useState<Attempt | null>(null);

  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);

  const [answers, setAnswers] = useState<Answer[]>([]);

  const [selectedAnswer, setSelectedAnswer] = useState<Answer | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  /*
   * Tracking guard.
   */
  const viewResultTracked = useRef(false);

  /* =======================================================
   * LOAD RESULT
   * ===================================================== */

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch(`/api/diagnostic/result/${attemptId}`);

        const data = (await response.json()) as {
          ok?: boolean;

          attempt?: Attempt;

          diagnostic?: DiagnosticResult;

          answers?: Answer[];

          error?: string;
        };

        if (!response.ok || !data.ok) {
          throw new Error(data.error ?? "Gagal memuat hasil diagnostic.");
        }

        if (!active) {
          return;
        }

        setAttempt(data.attempt ?? null);

        setDiagnostic(data.diagnostic ?? null);

        setAnswers(data.answers ?? []);
      } catch (err) {
        if (active) {
          setError((err as Error).message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [attemptId]);

  /* =======================================================
   * META VIEW RESULT
   *
   * LOCKED TRACKING
   * ===================================================== */

  useEffect(() => {
    if (loading || !attempt || !diagnostic) {
      return;
    }

    if (viewResultTracked.current) {
      return;
    }

    const storageKey = `meta_view_result_${attemptId}`;

    try {
      if (localStorage.getItem(storageKey)) {
        viewResultTracked.current = true;

        return;
      }

      viewResultTracked.current = true;

      trackMetaCustomEvent("ViewResult", {
        content_name: "Math Checkup Result",

        diagnostic_type: "math_checkup",
      });

      localStorage.setItem(storageKey, "1");
    } catch {
      viewResultTracked.current = true;

      trackMetaCustomEvent("ViewResult", {
        content_name: "Math Checkup Result",

        diagnostic_type: "math_checkup",
      });
    }
  }, [attemptId, attempt, diagnostic, loading]);

  /* =======================================================
   * DERIVED DATA
   * ===================================================== */

  const displayName = attempt ? formatName(attempt.student_name) : "";

  const priorityItems = useMemo(
    () => [
      ...(diagnostic?.priorityGaps ?? []),

      ...(diagnostic?.needsReview ?? []),
    ],
    [diagnostic],
  );

  const businessWhatsapp = (
    process.env.NEXT_PUBLIC_BESMARTKIDS_WHATSAPP ?? ""
  ).replace(/\D/g, "");

  const whatsappMessage = encodeURIComponent(
    `Halo BeSmartKids, saya ingin konsultasi hasil Math Check-Up ${displayName} kelas ${attempt?.grade_level ?? ""}. Hasil readiness: ${diagnostic?.readinessScore ?? "-"} / 100 (${diagnostic ? readinessText(diagnostic.readinessStatus) : ""}). Saya ingin mengetahui program belajar yang disarankan.`,
  );

  const whatsappHref = businessWhatsapp
    ? `https://wa.me/${businessWhatsapp}?text=${whatsappMessage}`
    : "#";

  function handleContact() {
    /*
     * Jangan kirim nama,
     * nomor WA,
     * score,
     * grade,
     * atau data anak
     * ke Meta.
     */
    trackMetaCustomEvent("Contact", {
      content_name: "Math Checkup Consultation",

      diagnostic_type: "math_checkup",
    });
  }

  /* =======================================================
   * LOADING / ERROR
   * ===================================================== */

  if (loading) {
    return (
      <main
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-[#f4f7fb]
          px-4
          text-center
        "
      >
        <div>
          <div
            className="
              mx-auto
              h-12
              w-12
              animate-spin
              rounded-full
              border-4
              border-blue-100
              border-t-blue-700
            "
          />

          <p
            className="
              mt-5
              font-black
              text-blue-700
            "
          >
            Menyusun laporan kemampuan...
          </p>
        </div>
      </main>
    );
  }

  if (error || !attempt || !diagnostic) {
    return (
      <main
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-red-50
          p-5
          text-center
          font-bold
          text-red-700
        "
      >
        {error ?? "Hasil diagnostic tidak tersedia."}
      </main>
    );
  }

  /* =======================================================
   * UI
   * ===================================================== */

  return (
    <main
      className="
        min-h-screen
        bg-[radial-gradient(circle_at_top_left,#dcfce7_0,#f5f8fc_30%,#f8fbff_100%)]
        text-[#102449]
      "
    >
      {/* HEADER */}

      <header
        className="
          bg-[#123a82]
          px-4
          py-3
          text-white
          shadow-sm
        "
      >
        <div
          className="
            mx-auto
            flex
            max-w-5xl
            items-center
            justify-between
            gap-4
          "
        >
          <img
            src="/images/logo_horizontal.png"
            alt="BeSmartKids"
            className="
              h-9
              w-auto
              rounded
              bg-white
              px-2
              py-1
              object-contain
            "
          />

          <span
            className="
              text-xs
              font-black
              sm:text-sm
            "
          >
            Math Check-Up Report
          </span>
        </div>
      </header>

      <div
        className="
          mx-auto
          max-w-5xl
          px-3
          py-5
          sm:px-6
          sm:py-8
        "
      >
        {/* HERO */}

        <section
          className="
            overflow-hidden
            border
            border-slate-200
            bg-white
            shadow-[0_25px_70px_-50px_rgba(15,23,42,0.7)]
          "
        >
          <div
            className="
              bg-gradient-to-br
              from-blue-50
              via-white
              to-emerald-50
              p-5
              sm:p-8
            "
          >
            <div
              className="
                text-center
              "
            >
              <p
                className="
                  text-xs
                  font-black
                  uppercase
                  tracking-[0.22em]
                  text-blue-600
                "
              >
                Mathematics Readiness
              </p>

              <h1
                className="
                  mt-2
                  text-2xl
                  font-black
                  sm:text-3xl
                "
              >
                Hasil Math Check-Up {displayName}
              </h1>

              <p
                className="
                  mt-2
                  text-sm
                  font-semibold
                  text-slate-600
                "
              >
                Kelas {attempt.grade_level} • Diagnostic {diagnostic.version}
              </p>
            </div>

            <div
              className="
                mt-7
                grid
                items-center
                gap-7
                border
                border-blue-100
                bg-white/95
                p-5
                lg:grid-cols-[1fr_260px]
                lg:p-7
              "
            >
              <div>
                <span
                  className={`
                    inline-flex
                    border
                    px-4
                    py-2
                    text-sm
                    font-black
                    ${readinessClass(diagnostic.readinessStatus)}
                  `}
                >
                  {readinessText(diagnostic.readinessStatus)}
                </span>

                <h2
                  className="
                    mt-5
                    text-2xl
                    font-black
                    leading-tight
                    sm:text-3xl
                  "
                >
                  Peta kesiapan matematika anak
                </h2>

                <p
                  className="
                    mt-3
                    max-w-2xl
                    text-sm
                    font-semibold
                    leading-7
                    text-slate-600
                  "
                >
                  {readinessDescription(diagnostic.readinessStatus)}
                </p>

                <p
                  className="
                    mt-4
                    max-w-2xl
                    text-sm
                    font-semibold
                    leading-7
                    text-slate-700
                  "
                >
                  {diagnostic.narrative}
                </p>
              </div>

              <ScoreCircle score={diagnostic.readinessScore} />
            </div>
          </div>
        </section>

        {/* BAND PERFORMANCE */}

        <section
          className="
            mt-5
            border
            border-slate-200
            bg-white
            p-5
            shadow-sm
            sm:p-7
          "
        >
          <div>
            <p
              className="
                text-xs
                font-black
                uppercase
                tracking-[0.18em]
                text-blue-700
              "
            >
              Performance by Level
            </p>

            <h2
              className="
                mt-1
                text-2xl
                font-black
              "
            >
              Kesiapan berdasarkan tingkat soal
            </h2>
          </div>

          <div
            className="
              mt-5
              grid
              gap-4
              lg:grid-cols-3
            "
          >
            <BandCard
              title="Foundation"
              band="foundation"
              data={diagnostic.bandScores.foundation}
            />

            <BandCard
              title="Grade Level"
              band="core"
              data={diagnostic.bandScores.core}
            />

            <BandCard
              title="Stretch"
              band="stretch"
              data={diagnostic.bandScores.stretch}
            />
          </div>

          <div
            className="
              mt-5
              border
              border-blue-100
              bg-blue-50
              p-4
              text-sm
              font-semibold
              leading-7
              text-slate-700
            "
          >
            Skor readiness tidak dihitung hanya dari jumlah jawaban benar.
            Foundation dan materi inti digunakan untuk membaca kesiapan anak,
            sedangkan soal Stretch berfungsi sebagai indikator kesiapan menuju
            tantangan berikutnya.
          </div>
        </section>

        {/* STRENGTH */}

        <section
          className="
            mt-5
            grid
            gap-5
            lg:grid-cols-2
          "
        >
          <div
            className="
              border
              border-emerald-200
              bg-white
              p-5
              shadow-sm
              sm:p-6
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  bg-emerald-600
                  font-black
                  text-white
                "
              >
                ✓
              </div>

              <div>
                <p
                  className="
                    text-xs
                    font-black
                    uppercase
                    tracking-[0.16em]
                    text-emerald-700
                  "
                >
                  Strengths
                </p>

                <h2
                  className="
                    text-xl
                    font-black
                  "
                >
                  Kekuatan Anak
                </h2>
              </div>
            </div>

            <div
              className="
                mt-5
                space-y-3
              "
            >
              {diagnostic.strengths.length > 0 ? (
                diagnostic.strengths.slice(0, 5).map((skill) => (
                  <div
                    key={skill.skill}
                    className="
                          border
                          border-emerald-100
                          bg-emerald-50/60
                          p-4
                        "
                  >
                    <div
                      className="
                            flex
                            flex-wrap
                            items-center
                            justify-between
                            gap-3
                          "
                    >
                      <p
                        className="
                              font-black
                              text-slate-800
                            "
                      >
                        {skill.skill}
                      </p>

                      <span
                        className={`
                              border
                              px-2
                              py-1
                              text-[11px]
                              font-black
                              ${skillStatusClass(skill.status)}
                            `}
                      >
                        {skillStatusLabel(skill.status)}
                      </span>
                    </div>

                    <p
                      className="
                            mt-2
                            text-xs
                            font-semibold
                            text-slate-500
                          "
                    >
                      Benar {skill.correct} dari {skill.total} evidence •{" "}
                      {confidenceLabel(skill.confidence)}
                    </p>
                  </div>
                ))
              ) : (
                <p
                  className="
                    text-sm
                    font-semibold
                    leading-7
                    text-slate-600
                  "
                >
                  Belum ada skill dengan evidence cukup untuk dikategorikan
                  sebagai kekuatan utama.
                </p>
              )}
            </div>
          </div>

          {/* GAPS */}

          <div
            className="
              border
              border-amber-200
              bg-white
              p-5
              shadow-sm
              sm:p-6
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  bg-amber-500
                  font-black
                  text-white
                "
              >
                !
              </div>

              <div>
                <p
                  className="
                    text-xs
                    font-black
                    uppercase
                    tracking-[0.16em]
                    text-amber-700
                  "
                >
                  Learning Gaps
                </p>

                <h2
                  className="
                    text-xl
                    font-black
                  "
                >
                  Prioritas Penguatan
                </h2>
              </div>
            </div>

            <div
              className="
                mt-5
                space-y-3
              "
            >
              {priorityItems.length > 0 ? (
                priorityItems.slice(0, 5).map((skill, index) => (
                  <div
                    key={`${skill.skill}-${index}`}
                    className="
                          border
                          border-amber-100
                          bg-amber-50/60
                          p-4
                        "
                  >
                    <div
                      className="
                            flex
                            items-start
                            gap-3
                          "
                    >
                      <span
                        className="
                              flex
                              h-7
                              w-7
                              shrink-0
                              items-center
                              justify-center
                              rounded-full
                              bg-[#123a82]
                              text-xs
                              font-black
                              text-white
                            "
                      >
                        {index + 1}
                      </span>

                      <div
                        className="
                              min-w-0
                              flex-1
                            "
                      >
                        <div
                          className="
                                flex
                                flex-wrap
                                items-center
                                justify-between
                                gap-2
                              "
                        >
                          <p
                            className="
                                  font-black
                                  text-slate-800
                                "
                          >
                            {skill.skill}
                          </p>

                          <span
                            className={`
                                  border
                                  px-2
                                  py-1
                                  text-[11px]
                                  font-black
                                  ${skillStatusClass(skill.status)}
                                `}
                          >
                            {skillStatusLabel(skill.status)}
                          </span>
                        </div>

                        <p
                          className="
                                mt-2
                                text-xs
                                font-semibold
                                leading-relaxed
                                text-slate-500
                              "
                        >
                          Benar {skill.correct} dari {skill.total} evidence •{" "}
                          {confidenceLabel(skill.confidence)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  className="
                    border
                    border-emerald-100
                    bg-emerald-50
                    p-4
                    text-sm
                    font-semibold
                    leading-7
                    text-emerald-800
                  "
                >
                  Tidak ditemukan priority gap yang signifikan pada diagnostic
                  ini.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ROOT GAP */}

        {diagnostic.rootGaps.length > 0 && (
          <section
            className="
              mt-5
              border
              border-rose-200
              bg-white
              p-5
              shadow-sm
              sm:p-7
            "
          >
            <p
              className="
                text-xs
                font-black
                uppercase
                tracking-[0.18em]
                text-rose-700
              "
            >
              Prerequisite Analysis
            </p>

            <h2
              className="
                mt-1
                text-2xl
                font-black
              "
            >
              Kemungkinan Akar Kesulitan
            </h2>

            <p
              className="
                mt-2
                max-w-3xl
                text-sm
                font-semibold
                leading-7
                text-slate-600
              "
            >
              Ketika kemampuan prasyarat dan skill di atasnya sama-sama
              bermasalah, pembelajaran sebaiknya dimulai dari kemampuan
              prasyarat terlebih dahulu.
            </p>

            <div
              className="
                mt-5
                grid
                gap-3
                md:grid-cols-2
              "
            >
              {diagnostic.rootGaps.map((gap) => (
                <div
                  key={gap.skill}
                  className="
                        border
                        border-rose-100
                        bg-rose-50
                        p-4
                      "
                >
                  <p
                    className="
                          text-xs
                          font-black
                          uppercase
                          tracking-[0.12em]
                          text-rose-600
                        "
                  >
                    Root / prerequisite
                  </p>

                  <p
                    className="
                          mt-1
                          text-lg
                          font-black
                          text-slate-900
                        "
                  >
                    {gap.skill}
                  </p>

                  <p
                    className="
                          mt-3
                          text-sm
                          font-semibold
                          leading-6
                          text-slate-600
                        "
                  >
                    Berpengaruh pada: {gap.affects.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* LEARNING PLAN */}

        <section
          className="
            mt-5
            border
            border-blue-200
            bg-white
            p-5
            shadow-sm
            sm:p-7
          "
        >
          <p
            className="
              text-xs
              font-black
              uppercase
              tracking-[0.18em]
              text-blue-700
            "
          >
            Personalized Recommendation
          </p>

          <h2
            className="
              mt-1
              text-2xl
              font-black
            "
          >
            Arah Belajar yang Disarankan
          </h2>

          <div
            className="
              mt-5
              border
              border-blue-100
              bg-gradient-to-br
              from-blue-50
              to-emerald-50
              p-5
            "
          >
            <p
              className="
                text-xs
                font-black
                uppercase
                tracking-[0.14em]
                text-blue-600
              "
            >
              Recommended Starting Point
            </p>

            <p
              className="
                mt-2
                text-2xl
                font-black
                text-[#102449]
              "
            >
              {diagnostic.recommendedStartingPoint.title}
            </p>

            <p
              className="
                mt-2
                text-sm
                font-semibold
                leading-7
                text-slate-600
              "
            >
              Ini merupakan titik awal yang disarankan berdasarkan pola jawaban
              dan kemampuan yang perlu diperkuat.
            </p>
          </div>

          {diagnostic.learningPath.length > 0 && (
            <div
              className="
                mt-6
              "
            >
              <p
                className="
                  text-sm
                  font-black
                  text-slate-800
                "
              >
                Personalized Learning Path
              </p>

              <div
                className="
                  mt-4
                  grid
                  gap-3
                  sm:grid-cols-2
                  lg:grid-cols-4
                "
              >
                {diagnostic.learningPath.map((step, index) => (
                  <div
                    key={`${step}-${index}`}
                    className="
                          relative
                          border
                          border-slate-200
                          bg-slate-50
                          p-4
                          pt-6
                        "
                  >
                    <span
                      className="
                            absolute
                            -top-3
                            left-4
                            flex
                            h-7
                            w-7
                            items-center
                            justify-center
                            rounded-full
                            bg-[#123a82]
                            text-xs
                            font-black
                            text-white
                          "
                    >
                      {index + 1}
                    </span>

                    <p
                      className="
                            font-black
                            text-[#102449]
                          "
                    >
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* CTA */}

        <section
          className="
            mt-5
            overflow-hidden
            bg-[#123a82]
            p-5
            text-white
            shadow-[0_24px_65px_-40px_rgba(30,64,175,0.85)]
            sm:p-7
          "
        >
          <div
            className="
              grid
              items-center
              gap-6
              lg:grid-cols-[1fr_300px]
            "
          >
            <div>
              <p
                className="
                  text-xs
                  font-black
                  uppercase
                  tracking-[0.18em]
                  text-blue-200
                "
              >
                Recommended Free Trial
              </p>

              <h2
                className="
                  mt-2
                  text-2xl
                  font-black
                  sm:text-3xl
                "
              >
                {diagnostic.trialFocus}
              </h2>

              <p
                className="
                  mt-3
                  max-w-2xl
                  text-sm
                  font-semibold
                  leading-7
                  text-blue-100
                "
              >
                Free Trial dapat difokuskan pada area yang ditemukan dari
                diagnostic ini, sehingga sesi pertama tidak dimulai secara acak.
              </p>
            </div>

            {businessWhatsapp ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                onClick={handleContact}
                className="
                  flex
                  min-h-14
                  items-center
                  justify-center
                  bg-white
                  px-5
                  py-4
                  text-center
                  font-black
                  text-blue-700
                  transition
                  hover:bg-emerald-50
                "
              >
                Konsultasi Hasil & Free Trial
              </a>
            ) : (
              <div
                className="
                  bg-white/10
                  px-5
                  py-4
                  text-center
                  text-sm
                  font-bold
                  text-white
                "
              >
                Nomor WhatsApp BeSmartKids belum dikonfigurasi.
              </div>
            )}
          </div>
        </section>

        {/* ANSWER HISTORY */}

        <section
          className="
            mt-5
            border
            border-slate-200
            bg-white
            p-5
            shadow-sm
            sm:p-7
          "
        >
          <p
            className="
              text-xs
              font-black
              uppercase
              tracking-[0.18em]
              text-blue-700
            "
          >
            Answer History
          </p>

          <h2
            className="
              mt-1
              text-2xl
              font-black
            "
          >
            Riwayat 24 Jawaban
          </h2>

          <p
            className="
              mt-2
              text-sm
              font-semibold
              text-slate-600
            "
          >
            Klik nomor soal untuk melihat jawaban anak dan pembahasannya.
          </p>

          <div
            className="
              mt-5
              grid
              grid-cols-4
              justify-items-center
              gap-3
              min-[380px]:grid-cols-5
              sm:grid-cols-8
              lg:grid-cols-12
            "
          >
            {answers.map((answer, index) => (
              <button
                key={answer.question_id}
                type="button"
                onClick={() => setSelectedAnswer(answer)}
                className={`
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-full
                    text-sm
                    font-black
                    text-white
                    transition
                    hover:-translate-y-1
                    ${
                      answer.is_correct
                        ? "bg-emerald-600 shadow-[0_10px_20px_-12px_rgba(5,150,105,0.8)]"
                        : "bg-red-600 shadow-[0_10px_20px_-12px_rgba(220,38,38,0.8)]"
                    }
                  `}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <div
            className="
              mt-5
              flex
              flex-wrap
              gap-5
              text-sm
              font-semibold
              text-slate-600
            "
          >
            <span
              className="
                flex
                items-center
                gap-2
              "
            >
              <span
                className="
                  h-4
                  w-4
                  rounded-full
                  bg-emerald-600
                "
              />
              Jawaban benar
            </span>

            <span
              className="
                flex
                items-center
                gap-2
              "
            >
              <span
                className="
                  h-4
                  w-4
                  rounded-full
                  bg-red-600
                "
              />
              Jawaban salah
            </span>
          </div>
        </section>

        <p
          className="
            py-7
            text-center
            text-xs
            font-semibold
            leading-6
            text-slate-400
          "
        >
          Hasil Math Check-Up BeSmartKids merupakan diagnostic pembelajaran
          internal untuk membantu menentukan titik awal belajar. Hasil ini bukan
          diagnosis klinis atau nilai sekolah.
        </p>
      </div>

      {/* ANSWER MODAL */}

      {selectedAnswer && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-start
            justify-center
            overflow-y-auto
            bg-slate-950/60
            p-3
            py-6
            sm:items-center
          "
          role="dialog"
          aria-modal="true"
        >
          <div
            className="
              w-full
              max-w-2xl
              border
              border-slate-200
              bg-white
              p-5
              shadow-2xl
              sm:p-6
            "
          >
            <div
              className="
                flex
                items-start
                justify-between
                gap-4
              "
            >
              <div>
                <span
                  className={`
                    inline-flex
                    border
                    px-3
                    py-1
                    text-xs
                    font-black
                    ${
                      selectedAnswer.is_correct
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-red-200 bg-red-50 text-red-700"
                    }
                  `}
                >
                  {selectedAnswer.is_correct
                    ? "Jawaban Benar"
                    : "Jawaban Salah"}
                </span>

                <h3
                  className="
                    mt-3
                    text-xl
                    font-black
                  "
                >
                  Pembahasan Soal
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAnswer(null)}
                className="
                  border
                  border-slate-200
                  px-3
                  py-2
                  text-sm
                  font-black
                  text-slate-600
                  hover:bg-slate-50
                "
              >
                Tutup
              </button>
            </div>

            <div
              className="
                mt-5
                space-y-4
              "
            >
              <div>
                <p
                  className="
                    text-xs
                    font-black
                    uppercase
                    tracking-[0.14em]
                    text-slate-400
                  "
                >
                  Soal
                </p>

                <div
                  className="
                    mt-2
                    text-base
                    font-black
                    leading-7
                    text-slate-900
                  "
                >
                  <MathText text={selectedAnswer.prompt} />
                </div>
              </div>

              <div
                className="
                  grid
                  gap-3
                  sm:grid-cols-2
                "
              >
                <div
                  className="
                    border
                    border-slate-200
                    bg-slate-50
                    p-4
                  "
                >
                  <p
                    className="
                      text-xs
                      font-black
                      text-slate-500
                    "
                  >
                    Jawaban anak
                  </p>

                  <div
                    className="
                      mt-2
                      font-black
                    "
                  >
                    <MathText text={selectedAnswer.selected_answer ?? "-"} />
                  </div>
                </div>

                <div
                  className="
                    border
                    border-emerald-200
                    bg-emerald-50
                    p-4
                  "
                >
                  <p
                    className="
                      text-xs
                      font-black
                      text-emerald-700
                    "
                  >
                    Jawaban benar
                  </p>

                  <div
                    className="
                      mt-2
                      font-black
                    "
                  >
                    <MathText text={selectedAnswer.correct_answer} />
                  </div>
                </div>
              </div>

              <div
                className="
                  border
                  border-blue-100
                  bg-blue-50
                  p-4
                "
              >
                <p
                  className="
                    text-xs
                    font-black
                    text-blue-700
                  "
                >
                  Penjelasan
                </p>

                <div
                  className="
                    mt-2
                    text-sm
                    font-semibold
                    leading-7
                    text-slate-700
                  "
                >
                  <MathText text={selectedAnswer.explanation} />
                </div>
              </div>

              <div
                className="
                  grid
                  gap-3
                  sm:grid-cols-2
                "
              >
                <div
                  className="
                    border
                    border-slate-200
                    p-3
                  "
                >
                  <p
                    className="
                      text-xs
                      font-black
                      text-slate-400
                    "
                  >
                    Skill
                  </p>

                  <p
                    className="
                      mt-1
                      text-sm
                      font-black
                      text-slate-800
                    "
                  >
                    {selectedAnswer.skill}
                  </p>
                </div>

                <div
                  className="
                    border
                    border-slate-200
                    p-3
                  "
                >
                  <p
                    className="
                      text-xs
                      font-black
                      text-slate-400
                    "
                  >
                    Level soal
                  </p>

                  <p
                    className="
                      mt-1
                      text-sm
                      font-black
                      capitalize
                      text-slate-800
                    "
                  >
                    {selectedAnswer.assessmentBand}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
