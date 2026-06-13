"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";

type QuestionMeta = {
  id: string;
  question_number: number;
  type: "mcq" | "essay" | "multipart" | "drag_drop";
  question_mode?: "practice" | "tryout" | null;
};

type QuestionOption = {
  label: string;
  value: string;
  image_url?: string | null;
};

type QuestionItem = {
  id: string;
  label: string;
  prompt: string;
  image_url?: string | null;
};

type DropTarget = {
  id: string;
  label: string;
  placeholder?: string | null;
};

type DropItem = {
  id: string;
  label: string;
  image_url?: string | null;
};

type Question = QuestionMeta & {
  prompt: string;
  helper_text?: string | null;
  question_image_url?: string | null;
  options: QuestionOption[];
  items: QuestionItem[];
  drop_targets: DropTarget[];
  drop_items: DropItem[];
};

type AnswerResult = {
  isCorrect: boolean;
  explanation?: string | null;
  correctAnswer?: string | null;
  correctAnswerImage?: string | null;
};

type Props = {
  materialId: number;
  questionMeta: QuestionMeta[];
  isGuest?: boolean;
  isAdmin?: boolean;
};

const PAGE_SIZE = 10;

export default function BatchPracticeQuiz({
  materialId,
  questionMeta,
  isGuest = false,
  isAdmin = false,
}: Props) {
  const orderedMeta = useMemo(
    () =>
      questionMeta
        .filter((question) => question.question_mode !== "tryout")
        .sort((a, b) => a.question_number - b.question_number),
    [questionMeta],
  );
  const [page, setPage] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, AnswerResult>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(orderedMeta.length / PAGE_SIZE));
  const pageMeta = useMemo(
    () => orderedMeta.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [orderedMeta, page],
  );

  useEffect(() => {
    let active = true;

    async function loadPage() {
      if (pageMeta.length === 0) {
        setQuestions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setAnswers({});
      setResults({});

      try {
        const start = pageMeta[0].question_number;
        const end = pageMeta[pageMeta.length - 1].question_number;
        const response = await fetch(
          `/api/materials/${materialId}/questions?mode=practice&start=${start}&end=${end}`,
        );
        const data = (await response.json()) as {
          ok?: boolean;
          questions?: Question[];
          error?: string;
        };

        if (!response.ok || !data.ok) {
          throw new Error(data.error ?? "Gagal memuat latihan soal.");
        }
        if (active) setQuestions(data.questions ?? []);
      } catch (loadError) {
        if (active) setError((loadError as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPage();
    return () => {
      active = false;
    };
  }, [materialId, pageMeta]);

  function setAnswer(questionId: string, value: string) {
    if (Object.keys(results).length > 0) return;
    setAnswers((current) => ({ ...current, [questionId]: value }));
  }

  function setMultipartAnswer(
    questionId: string,
    itemId: string,
    value: string,
  ) {
    let parsed: Record<string, string> = {};
    try {
      parsed = JSON.parse(answers[questionId] ?? "{}");
    } catch {
      parsed = {};
    }
    parsed[itemId] = value;
    setAnswer(questionId, JSON.stringify(parsed));
  }

  function setDropAnswer(
    questionId: string,
    targetId: string,
    itemId: string,
  ) {
    let parsed: Record<string, string> = {};
    try {
      parsed = JSON.parse(answers[questionId] ?? "{}");
    } catch {
      parsed = {};
    }
    parsed[targetId] = itemId;
    setAnswer(questionId, JSON.stringify(parsed));
  }

  function isAnswered(question: Question) {
    const answer = answers[question.id];
    if (!answer?.trim()) return false;

    if (question.type === "multipart") {
      try {
        const parsed = JSON.parse(answer) as Record<string, string>;
        return (
          question.items.length > 0 &&
          question.items.every((item) => parsed[item.id]?.trim())
        );
      } catch {
        return false;
      }
    }

    if (question.type === "drag_drop") {
      try {
        const parsed = JSON.parse(answer) as Record<string, string>;
        return (
          question.drop_targets.length > 0 &&
          question.drop_targets.every((target) => parsed[target.id]?.trim())
        );
      } catch {
        return false;
      }
    }

    return true;
  }

  const allAnswered =
    questions.length > 0 && questions.every((question) => isAnswered(question));
  const submitted = Object.keys(results).length === questions.length;

  async function submitPage() {
    if (!allAnswered || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const responses = await Promise.all(
        questions.map(async (question) => {
          const response = await fetch(`/api/materials/${materialId}/answer`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              questionId: question.id,
              questionNumber: question.question_number,
              selectedAnswer: answers[question.id],
              attemptNumber: 1,
            }),
          });
          const data = (await response.json()) as AnswerResult & {
            error?: string;
          };
          if (!response.ok) {
            throw new Error(data.error ?? "Gagal memeriksa jawaban.");
          }
          return [question.id, data] as const;
        }),
      );

      setResults(Object.fromEntries(responses));
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function movePage(nextPage: number) {
    setPage(nextPage);
    window.setTimeout(() => {
      document
        .getElementById("batch-practice-top")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Memuat 10 soal latihan...
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Belum ada soal latihan pada materi ini.
      </div>
    );
  }

  return (
    <section id="batch-practice-top" className="space-y-5">
      <header className="sticky top-2 z-30 flex flex-col gap-3 rounded-lg border border-emerald-200 bg-white/95 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
            Latihan Soal
          </p>
          <h2 className="mt-1 text-lg font-extrabold text-slate-900">
            Soal {page * PAGE_SIZE + 1}–
            {Math.min((page + 1) * PAGE_SIZE, orderedMeta.length)} dari{" "}
            {orderedMeta.length}
          </h2>
        </div>
        <span className="rounded-md bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
          Halaman {page + 1} dari {totalPages}
        </span>
      </header>

      {questions.map((question, index) => {
        const result = results[question.id];
        const cardColor = result
          ? result.isCorrect
            ? "border-emerald-400 bg-emerald-50"
            : "border-red-400 bg-red-50"
          : "border-slate-200 bg-white";

        return (
          <article
            key={question.id}
            className={`rounded-lg border p-4 shadow-sm transition sm:p-6 ${cardColor}`}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-sm font-extrabold text-white">
                {page * PAGE_SIZE + index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="whitespace-pre-line text-base font-bold leading-relaxed text-slate-900">
                  {question.prompt}
                </h3>
                {question.helper_text && (
                  <p className="mt-1 text-sm text-slate-600">
                    {question.helper_text}
                  </p>
                )}
              </div>
            </div>

            {question.question_image_url && (
              <img
                src={question.question_image_url}
                alt={`Gambar soal ${page * PAGE_SIZE + index + 1}`}
                className="mx-auto mt-4 max-h-[420px] max-w-full rounded-md border border-slate-200 bg-white object-contain"
              />
            )}

            <div className="mt-5">
              {question.type === "mcq" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {question.options.map((option) => (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition ${
                        answers[question.id] === option.value
                          ? "border-emerald-500 bg-emerald-100"
                          : "border-slate-200 bg-white hover:border-emerald-300"
                      } ${submitted ? "cursor-default" : ""}`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option.value}
                        checked={answers[question.id] === option.value}
                        disabled={submitted}
                        onChange={() => setAnswer(question.id, option.value)}
                        className="mt-1 accent-emerald-600"
                      />
                      <span className="text-sm font-semibold text-slate-700">
                        {option.label}
                        {option.image_url && (
                          <img
                            src={option.image_url}
                            alt={option.label}
                            className="mt-2 max-h-40 rounded-md object-contain"
                          />
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === "essay" && (
                <textarea
                  value={answers[question.id] ?? ""}
                  disabled={submitted}
                  onChange={(event) =>
                    setAnswer(question.id, event.target.value)
                  }
                  rows={3}
                  placeholder="Tuliskan jawabanmu..."
                  className="w-full rounded-md border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-emerald-500 disabled:bg-slate-100"
                />
              )}

              {question.type === "multipart" && (
                <div className="space-y-3">
                  {question.items.map((item) => {
                    let parsed: Record<string, string> = {};
                    try {
                      parsed = JSON.parse(answers[question.id] ?? "{}");
                    } catch {
                      parsed = {};
                    }
                    return (
                      <label key={item.id} className="block">
                        <span className="text-sm font-semibold text-slate-700">
                          {item.label}. {item.prompt}
                        </span>
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.prompt}
                            className="my-2 max-h-52 rounded-md object-contain"
                          />
                        )}
                        <input
                          value={parsed[item.id] ?? ""}
                          disabled={submitted}
                          onChange={(event) =>
                            setMultipartAnswer(
                              question.id,
                              item.id,
                              event.target.value,
                            )
                          }
                          className="mt-2 w-full rounded-md border border-slate-300 bg-white p-3 text-sm outline-none focus:border-emerald-500 disabled:bg-slate-100"
                          placeholder="Jawaban bagian ini..."
                        />
                      </label>
                    );
                  })}
                </div>
              )}

              {question.type === "drag_drop" && (
                <div className="space-y-3">
                  {question.drop_targets.map((target) => {
                    let parsed: Record<string, string> = {};
                    try {
                      parsed = JSON.parse(answers[question.id] ?? "{}");
                    } catch {
                      parsed = {};
                    }
                    return (
                      <label key={target.id} className="block">
                        <span className="text-sm font-semibold text-slate-700">
                          {target.label}
                        </span>
                        <select
                          value={parsed[target.id] ?? ""}
                          disabled={submitted}
                          onChange={(event) =>
                            setDropAnswer(
                              question.id,
                              target.id,
                              event.target.value,
                            )
                          }
                          className="mt-2 w-full rounded-md border border-slate-300 bg-white p-3 text-sm outline-none focus:border-emerald-500 disabled:bg-slate-100"
                        >
                          <option value="">
                            {target.placeholder || "Pilih jawaban"}
                          </option>
                          {question.drop_items.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {result && (
              <div
                className={`mt-5 rounded-md border p-4 ${
                  result.isCorrect
                    ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                    : "border-red-300 bg-red-100 text-red-900"
                }`}
              >
                <p className="font-extrabold">
                  {result.isCorrect
                    ? "Jawaban sudah benar."
                    : "Jawaban belum tepat."}
                </p>
                {!result.isCorrect && (
                  <>
                    {result.correctAnswer && (
                      <p className="mt-2 text-sm">
                        Jawaban benar:{" "}
                        <strong>{result.correctAnswer}</strong>
                      </p>
                    )}
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
                      {result.explanation ||
                        "Periksa kembali langkah pengerjaan dan coba pahami konsep pada soal ini."}
                    </p>
                    {result.correctAnswerImage && (
                      <img
                        src={result.correctAnswerImage}
                        alt="Gambar jawaban benar"
                        className="mt-3 max-h-64 rounded-md bg-white object-contain"
                      />
                    )}
                  </>
                )}
              </div>
            )}
          </article>
        );
      })}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!submitted ? (
        <button
          type="button"
          disabled={!allAnswered || submitting}
          onClick={submitPage}
          className="w-full rounded-lg bg-emerald-600 px-6 py-4 text-base font-extrabold text-white shadow-md transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
        >
          {submitting
            ? "Memeriksa jawaban..."
            : allAnswered
              ? "Submit dan Periksa Jawaban"
              : "Jawab semua soal untuk mengaktifkan Submit"}
        </button>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row">
          {page > 0 && (
            <button
              type="button"
              onClick={() => movePage(page - 1)}
              className="flex-1 rounded-lg border border-emerald-300 bg-white px-5 py-3 font-bold text-emerald-700 hover:bg-emerald-50"
            >
              Halaman Sebelumnya
            </button>
          )}
          {page < totalPages - 1 ? (
            <button
              type="button"
              onClick={() => movePage(page + 1)}
              className="flex-1 rounded-lg bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-500"
            >
              Lanjut 10 Soal Berikutnya
            </button>
          ) : (
            <div className="flex-1 rounded-lg border border-emerald-300 bg-emerald-50 px-5 py-3 text-center font-bold text-emerald-800">
              Semua soal telah selesai diperiksa.
            </div>
          )}
        </div>
      )}

      {(isGuest || isAdmin) && (
        <p className="text-center text-xs text-slate-500">
          {isAdmin
            ? "Mode admin: hasil latihan tidak disimpan sebagai progres siswa."
            : "Mode tamu: hasil latihan tidak disimpan ke akun."}
        </p>
      )}
    </section>
  );
}
