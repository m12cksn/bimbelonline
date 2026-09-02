"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import MathText from "@/app/components/MathText";
import { trackMetaCustomEvent } from "@/lib/meta-pixel";

type Question = {
  id: string;
  category: string;
  difficulty: string;
  prompt: string;
  options: string[];
};

function formatName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

type Attempt = {
  id: string;
  student_name: string;
  grade_level: number;
  status: string;
};

export default function MathCheckupTestClient({
  attemptId,
}: {
  attemptId: string;
}) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startDiagnosticTracked = useRef(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch(`/api/diagnostic/${attemptId}`);
        const data = (await response.json()) as {
          ok?: boolean;
          attempt?: Attempt;
          questions?: Question[];
          error?: string;
        };
        if (!response.ok || !data.ok)
          throw new Error(data.error ?? "Gagal memuat tes.");
        if (!active) return;
        setAttempt(data.attempt ?? null);
        setQuestions(data.questions ?? []);
      } catch (err) {
        if (active) setError((err as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [attemptId]);

  const current = questions[index];
  const progress = questions.length
    ? Math.round(((index + 1) / questions.length) * 100)
    : 0;
  const answeredCount = questions.filter(
    (question) => answers[question.id],
  ).length;
  const allAnswered = useMemo(
    () =>
      questions.length > 0 &&
      questions.every((question) => answers[question.id]),
    [answers, questions],
  );

  function trackStartDiagnosticOnce() {
    if (startDiagnosticTracked.current) return;

    const storageKey = `meta_start_diagnostic_${attemptId}`;

    try {
      const alreadyTracked = localStorage.getItem(storageKey);

      if (alreadyTracked) {
        startDiagnosticTracked.current = true;
        return;
      }

      trackMetaCustomEvent("StartDiagnostic", {
        diagnostic_type: "math_checkup",
      });

      localStorage.setItem(storageKey, "1");
      startDiagnosticTracked.current = true;
    } catch {
      // Fallback jika localStorage tidak tersedia.
      trackMetaCustomEvent("StartDiagnostic", {
        diagnostic_type: "math_checkup",
      });

      startDiagnosticTracked.current = true;
    }
  }

  async function submit() {
    if (!allAnswered || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/diagnostic/${attemptId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Gagal menyimpan hasil.");
      }

      /*
       * Diagnostic benar-benar berhasil disimpan.
       */
      trackMetaCustomEvent("CompleteDiagnostic", {
        diagnostic_type: "math_checkup",
      });

      router.push(`/math-checkup/result/${attemptId}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8f3] p-4 text-lg font-black text-emerald-800">
        Menyiapkan soal...
      </main>
    );
  }

  if (error || !current || !attempt) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-red-50 p-4 text-center font-bold text-red-700">
        {error ?? "Soal tidak tersedia."}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-950">
      <header className="bg-[#123a82] px-4 py-4 text-white shadow-sm sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center">
            <img
              src="/images/logo_horizontal.png"
              alt="BeSmartKids"
              className="h-9 w-auto rounded bg-white/95 px-2 py-1 object-contain"
            />
          </div>
          <div className="hidden text-sm font-black sm:block">
            Cek Matematika - Kelas {attempt.grade_level}
          </div>
          <button
            type="button"
            onClick={() => router.push("/math-checkup")}
            className="text-xs font-bold text-blue-100 hover:text-white"
          >
            Keluar
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-4 border border-slate-200 bg-white p-4 shadow-[0_14px_45px_-36px_rgba(15,23,42,0.75)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-slate-500">
                Soal {index + 1} dari {questions.length}
              </p>
              <p className="text-xs font-semibold text-slate-500">
                {formatName(attempt.student_name)} sudah menjawab{" "}
                {answeredCount} soal.
              </p>
            </div>
            <div className="text-sm font-black text-[#123a82]">
              {progress}% selesai
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden bg-slate-100">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
          <section className="border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-52px_rgba(15,23,42,0.85)] sm:p-7">
            <div className="mb-5 flex flex-wrap gap-2 text-xs font-extrabold">
              <span className="bg-blue-50 px-3 py-1 text-[#123a82]">
                {current.category}
              </span>
              <span className="bg-slate-100 px-3 py-1 text-slate-600">
                Tingkat {current.difficulty}
              </span>
            </div>
            <h1 className="text-2xl font-black leading-relaxed tracking-tight sm:text-3xl">
              <MathText text={current.prompt} />
            </h1>

            <div className="mt-7 grid gap-3">
              {current.options.map((option, optionIndex) => {
                const selected = answers[current.id] === option;
                const label = String.fromCharCode(65 + optionIndex);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      trackStartDiagnosticOnce();

                      setAnswers((prev) => ({
                        ...prev,
                        [current.id]: option,
                      }));
                    }}
                    className={`flex items-center gap-3 border px-4 py-3 text-left text-base font-black transition ${
                      selected
                        ? "border-blue-600 bg-blue-50 text-[#123a82] shadow-[0_18px_42px_-34px_rgba(37,99,235,0.95)]"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm ${selected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 text-slate-500"}`}
                    >
                      {label}
                    </span>
                    <span>
                      <MathText text={option} />
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => setIndex((value) => Math.max(0, value - 1))}
                className="border border-slate-200 bg-white px-5 py-3 font-black text-slate-700 disabled:opacity-40"
              >
                Sebelumnya
              </button>
              {index < questions.length - 1 ? (
                <button
                  type="button"
                  disabled={!answers[current.id]}
                  onClick={() =>
                    setIndex((value) =>
                      Math.min(questions.length - 1, value + 1),
                    )
                  }
                  className="bg-blue-600 px-5 py-3 font-black text-white shadow-[0_18px_50px_-34px_rgba(37,99,235,0.9)] disabled:opacity-40"
                >
                  Selanjutnya
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!allAnswered || submitting}
                  onClick={submit}
                  className="bg-emerald-600 px-5 py-3 font-black text-white shadow-[0_18px_50px_-34px_rgba(4,120,87,0.9)] disabled:opacity-40"
                >
                  {submitting
                    ? "Menganalisis hasil..."
                    : allAnswered
                      ? "Lihat Laporan"
                      : "Jawab semua soal dulu"}
                </button>
              )}
            </div>
          </section>

          <aside className="border border-slate-200 bg-white p-5 shadow-[0_24px_70px_-52px_rgba(15,23,42,0.75)] lg:sticky lg:top-5 lg:self-start">
            <h2 className="text-center text-lg font-black">Daftar Soal</h2>
            <div className="mt-5 grid grid-cols-5 gap-2">
              {questions.map((question, questionIndex) => {
                const isCurrent = questionIndex === index;
                const isAnswered = Boolean(answers[question.id]);
                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => setIndex(questionIndex)}
                    className={`h-10 w-10 rounded-full text-sm font-black transition ${
                      isCurrent
                        ? "bg-blue-600 text-white"
                        : isAnswered
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                    aria-label={`Ke soal ${questionIndex + 1}`}
                  >
                    {questionIndex + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-5 space-y-2 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500" /> Sudah
                dijawab
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-blue-600" /> Sedang
                dikerjakan
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-slate-200" /> Belum
                dijawab
              </div>
            </div>
            <button
              type="button"
              disabled={!allAnswered || submitting}
              onClick={submit}
              className="mt-5 w-full bg-[#123a82] px-4 py-3 text-sm font-black text-white disabled:opacity-40"
            >
              {submitting ? "Memproses..." : "Kirim Jawaban"}
            </button>
          </aside>
        </div>

        {error && (
          <div className="mt-4 border border-red-200 bg-red-50 p-4 font-bold text-red-700">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}
