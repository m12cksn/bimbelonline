"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type QuestionOption = {
  value: string;
  label: string;
  imageUrl?: string;
  targetKey?: string;
};

type RawOption = string | QuestionOption;

type Question = {
  id: number;
  question_number: number;
  text: string;
  options: RawOption[] | null;
};

type StructuredQuestion = {
  prompt?: string;
  imageUrl?: string;
  helperText?: string;
  type?: "multiple_choice" | "essay" | "drag_drop";
  dropTargets?: { key: string; label: string; placeholder?: string }[];
};

type NormalizedQuestion = {
  prompt: string;
  helperText?: string;
  imageUrl?: string;
  type: "multiple_choice" | "essay" | "drag_drop";
  options: QuestionOption[];
  dropTargets?: { key: string; label: string; placeholder?: string }[];
};

interface Props {
  materialId: number;
  questions: Question[];
  initialLastNumber: number;
  userId: string;
  isPremium: boolean;
}

const FREE_LIMIT = 8;

export default function MaterialQuiz({
  materialId,
  questions,
  initialLastNumber,
  userId,
  isPremium,
}: Props) {
  const [currentNumber, setCurrentNumber] = useState(
    initialLastNumber > 0 ? initialLastNumber + 1 : 1
  );
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean | null;
    message: string | null;
  }>({ isCorrect: null, message: null });

  const [lockedMessage, setLockedMessage] = useState<string | null>(null);

  // tambahan state untuk tipe soal lain
  const [essayAnswer, setEssayAnswer] = useState<string>("");
  const [draggingValue, setDraggingValue] = useState<string | null>(null);
  const [placements, setPlacements] = useState<Record<string, string>>({});

  useEffect(() => {
    setCurrentNumber(initialLastNumber > 0 ? initialLastNumber + 1 : 1);
  }, [initialLastNumber, userId]);

  // ⬇️ statistik sesi untuk review akhir
  const [sessionStats, setSessionStats] = useState<{
    totalAnswered: number;
    correct: number;
  }>({ totalAnswered: 0, correct: 0 });

  const totalQuestions = questions.length;

  const currentQuestion = questions.find(
    (q) => q.question_number === currentNumber
  );

  const normalizedQuestion: NormalizedQuestion | null = useMemo(() => {
    if (!currentQuestion) return null;

    let parsed: StructuredQuestion | null = null;

    try {
      const maybeJson = JSON.parse(currentQuestion.text);
      if (maybeJson && typeof maybeJson === "object") {
        parsed = maybeJson as StructuredQuestion;
      }
    } catch {
      // abaikan, text biasa
    }

    const basePrompt = parsed?.prompt ?? currentQuestion.text;

    const normalizedOptions: QuestionOption[] = (currentQuestion.options || [])
      .map((opt) => {
        if (typeof opt === "string") {
          return {
            value: opt,
            label: opt,
          } satisfies QuestionOption;
        }

        return {
          value: opt.value,
          label: opt.label ?? opt.value,
          imageUrl: opt.imageUrl,
          targetKey: opt.targetKey,
        } satisfies QuestionOption;
      })
      .filter(Boolean);

    const hasDropTargets =
      parsed?.type === "drag_drop" ||
      normalizedOptions.some((opt) => Boolean(opt.targetKey)) ||
      Boolean(parsed?.dropTargets?.length);

    const dropTargets = hasDropTargets
      ? parsed?.dropTargets ??
        Array.from(
          new Set(
            normalizedOptions
              .map((opt) => opt.targetKey)
              .filter((val): val is string => Boolean(val))
          )
        ).map((key) => ({ key, label: key }))
      : undefined;

    const questionType: NormalizedQuestion["type"] = parsed?.type
      ? parsed.type
      : hasDropTargets
      ? "drag_drop"
      : normalizedOptions.length > 0
      ? "multiple_choice"
      : "essay";

    return {
      prompt: basePrompt,
      helperText: parsed?.helperText,
      imageUrl: parsed?.imageUrl,
      type: questionType,
      options: normalizedOptions,
      dropTargets,
    } satisfies NormalizedQuestion;
  }, [currentQuestion]);

  useEffect(() => {
    setEssayAnswer("");
    setPlacements({});
    setDraggingValue(null);
    setFeedback({ isCorrect: null, message: null });
    setLockedMessage(null);
  }, [currentQuestion?.id]);

  // ✅ Kalau sudah tidak ada soal lagi → tampilkan halaman review
  if (!currentQuestion || !normalizedQuestion) {
    const answered = sessionStats.totalAnswered;
    const correct = sessionStats.correct;
    const wrong = Math.max(0, answered - correct);
    const score = answered > 0 ? Math.round((correct / answered) * 100) : 0;

    let messageTitle = "Keren, kamu sudah menyelesaikan materi ini! 🎉";
    let messageBody =
      "Terima kasih sudah berusaha mengerjakan semua soal di materi ini.";

    if (score >= 90) {
      messageTitle = "Luar biasa! 🔥";
      messageBody =
        "Kamu menjawab hampir semua soal dengan benar. Pertahankan ya, kamu sudah sangat menguasai materi ini!";
    } else if (score >= 80) {
      messageTitle = "Sangat bagus! 😄";
      messageBody =
        "Kamu hampir menjawab benar semua soal. Sedikit lagi latihan, kamu pasti bisa 100%!";
    } else if (score >= 60) {
      messageTitle = "Cukup bagus 👍";
      messageBody =
        "Kamu sudah mengerti sebagian besar materi, tapi masih ada beberapa soal yang perlu kamu latihan lagi.";
    } else if (answered > 0) {
      messageTitle = "Jangan menyerah ya 💪";
      messageBody =
        "Kamu sudah berusaha mengerjakan soal. Coba ulangi lagi materi dan latihan pelan-pelan, kamu pasti bisa meningkat!";
    }

    function handleRetry() {
      // mulai lagi dari soal pertama (percobaan kedua)
      setCurrentNumber(1);
      setFeedback({ isCorrect: null, message: null });
      setLockedMessage(null);
      setSessionStats({ totalAnswered: 0, correct: 0 });
      // tidak perlu reset ke server, karena kita memang batasi 2x attempt per soal di backend
    }

    return (
      <div className="mt-6 rounded-2xl border border-emerald-500/40 bg-slate-900/90 p-4 text-sm text-slate-50 shadow-xl shadow-black/40">
        <h2 className="text-lg font-bold text-emerald-300 mb-1">
          {messageTitle}
        </h2>
        <p className="text-xs text-slate-200 mb-3 whitespace-pre-line">
          {messageBody}
        </p>

        <div className="grid grid-cols-3 gap-2 text-[11px] mb-3">
          <div className="rounded-xl bg-slate-800/80 p-2 text-center">
            <div className="text-slate-400">Benar</div>
            <div className="text-lg font-bold text-emerald-300">{correct}</div>
          </div>
          <div className="rounded-xl bg-slate-800/80 p-2 text-center">
            <div className="text-slate-400">Salah</div>
            <div className="text-lg font-bold text-red-300">{wrong}</div>
          </div>
          <div className="rounded-xl bg-slate-800/80 p-2 text-center">
            <div className="text-slate-400">Total dijawab</div>
            <div className="text-lg font-bold text-slate-100">{answered}</div>
          </div>
        </div>

        <div className="mb-3 text-[11px] text-slate-200">
          Nilai sesi ini:{" "}
          <span className="font-bold text-emerald-300">{score}%</span>
        </div>

        <div className="mb-4 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400"
            style={{ width: `${score}%` }}
          />
        </div>

        <div className="flex flex-wrap gap-2 text-[11px]">
          <Link
            href="/dashboard/student"
            className="rounded-xl border border-cyan-400/70 bg-cyan-500/20 px-3 py-2 font-semibold text-cyan-100 hover:bg-cyan-500/40"
          >
            ⬅️ Kembali ke Dashboard
          </Link>
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-xl border border-emerald-400/70 bg-emerald-500/20 px-3 py-2 font-semibold text-emerald-100 hover:bg-emerald-500/40"
          >
            🔁 Mulai percobaan kedua
          </button>
        </div>
      </div>
    );
  }

  const isLockedPremium =
    !isPremium && (currentQuestion?.question_number ?? 0) > FREE_LIMIT;

  async function handleAnswer(selected: string) {
    if (!currentQuestion) return;

    setLoading(true);
    setFeedback({ isCorrect: null, message: null });
    setLockedMessage(null);

    try {
      const res = await fetch(`/api/materials/${materialId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          questionNumber: currentQuestion.question_number,
          selectedAnswer: selected,
        }),
      });

      const data = await res.json();

      // debug
      console.log("API answer response:", data);

      if (data.locked) {
        setLockedMessage(
          data.message ||
            "Soal ini terkunci. Untuk lanjut, silakan hubungi guru / admin."
        );
        return;
      }

      const isCorrect: boolean = !!data.isCorrect;
      const correctAnswer: string | undefined = data.correctAnswer;
      const explanation: string | undefined = data.explanation ?? undefined;

      // ⬇️ update statistik sesi hanya kalau jawaban benar-benar diproses
      setSessionStats((prev) => ({
        totalAnswered: prev.totalAnswered + 1,
        correct: prev.correct + (isCorrect ? 1 : 0),
      }));

      let message: string;

      if (isCorrect) {
        message = "Mantap! Jawaban kamu benar 😄";
      } else {
        if (correctAnswer) {
          message = `Belum tepat. Jawaban yang benar: ${correctAnswer}`;
        } else {
          message = "Belum tepat. Coba lagi ya, kamu pasti bisa!";
        }

        if (explanation) {
          message += `\nPenjelasan: ${explanation}`;
        }
      }

      setFeedback({
        isCorrect,
        message,
      });

      // pindah ke soal berikutnya setelah delay
      setTimeout(() => {
        setCurrentNumber((prev) => prev + 1);
        setFeedback({ isCorrect: null, message: null });
      }, 900);
    } catch (e) {
      console.error(e);
      setFeedback({
        isCorrect: null,
        message: "Ups, terjadi error saat mengirim jawaban.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-3 text-xs text-slate-200 shadow-lg shadow-black/40 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/40 via-purple-500/30 to-emerald-400/30 text-base font-bold text-white shadow-md shadow-cyan-500/30">
            {currentQuestion.question_number}
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-400">Soal untukmu</div>
            <div className="font-semibold text-white">
              {currentQuestion.question_number}/{questions.length} • {normalizedQuestion.type === "essay" ? "Jawab bebas" : normalizedQuestion.type === "drag_drop" ? "Seret & jatuhkan" : "Pilih jawaban"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400"
              style={{ width: `${Math.min(100, Math.round((currentQuestion.question_number / Math.max(totalQuestions, 1)) * 100))}%` }}
            />
          </div>
          <div className="rounded-full bg-slate-900 px-2 py-1 text-[10px] border border-slate-700">
            {currentQuestion.question_number <= FREE_LIMIT ? (
              <span className="text-emerald-300">Gratis 🎁</span>
            ) : isPremium ? (
              <span className="text-amber-300">Premium (terbuka) ⭐</span>
            ) : (
              <span className="text-yellow-300">Premium 🔒</span>
            )}
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl shadow-black/40">
        <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-tr from-cyan-500/25 via-purple-500/25 to-pink-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-16 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-500/25 via-cyan-500/25 to-indigo-500/25 blur-3xl" />

        <div className="relative z-10 space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">{normalizedQuestion.prompt}</p>
              {normalizedQuestion.helperText && (
                <p className="text-[11px] text-slate-300">{normalizedQuestion.helperText}</p>
              )}
            </div>

            {normalizedQuestion.imageUrl && (
              <div className="max-w-xs overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 p-2 shadow-inner shadow-black/40">
                <img
                  src={normalizedQuestion.imageUrl}
                  alt="Ilustrasi soal"
                  className="h-full w-full rounded-xl object-contain"
                />
              </div>
            )}
          </div>

          {isLockedPremium ? (
            <div className="relative z-10 rounded-xl border border-yellow-400/50 bg-yellow-500/15 p-3 text-xs text-yellow-100">
              <p className="mb-1 font-semibold">Soal premium 🔒</p>
              <p className="text-[11px] text-yellow-100">
                Kamu sudah menyelesaikan semua soal gratis. Untuk membuka soal berikutnya, silakan hubungi guru / admin untuk upgrade paket ya. 🙂
              </p>
            </div>
          ) : (
            <>
              {normalizedQuestion.type === "multiple_choice" && (
                <div className="grid gap-2 md:grid-cols-2">
                  {normalizedQuestion.options.map((opt) => (
                    <button
                      key={opt.value}
                      disabled={loading}
                      onClick={() => handleAnswer(opt.value)}
                      className="group relative w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/80 px-3 py-3 text-left text-sm text-slate-50 transition hover:-translate-y-0.5 hover:border-cyan-400 hover:bg-slate-800 hover:shadow-md hover:shadow-cyan-500/30 disabled:opacity-60"
                    >
                      {opt.imageUrl && (
                        <div className="mb-2 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
                          <img src={opt.imageUrl} alt={opt.label} className="h-32 w-full object-contain" />
                        </div>
                      )}
                      <span className="font-semibold text-white">{opt.label}</span>
                      <div className="pointer-events-none absolute -bottom-6 -right-8 h-16 w-16 rounded-full bg-gradient-to-tr from-cyan-500/20 via-purple-500/20 to-pink-500/20 blur-xl" />
                    </button>
                  ))}
                </div>
              )}

              {normalizedQuestion.type === "essay" && (
                <div className="space-y-2">
                  <textarea
                    value={essayAnswer}
                    onChange={(e) => setEssayAnswer(e.target.value)}
                    placeholder="Tulis jawabanmu di sini..."
                    className="w-full rounded-2xl border border-slate-700 bg-slate-800/80 p-3 text-sm text-slate-50 shadow-inner shadow-black/40 focus:border-cyan-400 focus:outline-none"
                    rows={5}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
                    <span>Ekspresikan jawaban dengan bahasamu sendiri. Kamu boleh menulis langkah-langkahnya.</span>
                    <button
                      type="button"
                      disabled={loading || !essayAnswer.trim()}
                      onClick={() => handleAnswer(essayAnswer.trim())}
                      className="rounded-xl border border-emerald-400/70 bg-emerald-500/30 px-3 py-2 font-semibold text-emerald-50 shadow-md shadow-emerald-500/30 transition hover:-translate-y-px hover:bg-emerald-500/40 disabled:opacity-60"
                    >
                      Kirim jawaban
                    </button>
                  </div>
                </div>
              )}

              {normalizedQuestion.type === "drag_drop" && (
                <div className="grid gap-4 md:grid-cols-[1.4fr,1fr]">
                  <div className="space-y-2">
                    <div className="grid gap-2 md:grid-cols-2">
                      {normalizedQuestion.options.map((opt) => {
                        const isUsed = Object.values(placements).includes(opt.value);
                        return (
                          <div
                            key={opt.value}
                            draggable={!isUsed}
                            onDragStart={() => setDraggingValue(opt.value)}
                            onDragEnd={() => setDraggingValue(null)}
                            className={`relative rounded-2xl border p-3 text-sm shadow-inner transition ${
                              isUsed
                                ? "cursor-not-allowed border-slate-700 bg-slate-800/40 text-slate-500"
                                : "cursor-grab border-slate-700 bg-slate-800/80 text-slate-50 hover:-translate-y-px hover:border-cyan-400"
                            }`}
                          >
                            {opt.imageUrl && (
                              <div className="mb-2 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
                                <img src={opt.imageUrl} alt={opt.label} className="h-24 w-full object-contain" />
                              </div>
                            )}
                            <div className="font-semibold">{opt.label}</div>
                            <div className="pointer-events-none absolute -bottom-6 -right-10 h-16 w-16 rounded-full bg-gradient-to-tr from-cyan-500/15 via-purple-500/15 to-pink-500/15 blur-xl" />
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-slate-300">Seret kartu ke kotak jawaban yang tepat. Kamu dapat mengganti pilihan dengan menyeret ulang.</p>
                  </div>

                  <div className="space-y-2 rounded-2xl border border-slate-700 bg-slate-800/80 p-3 shadow-inner shadow-black/30">
                    <div className="text-[11px] font-semibold text-cyan-200">Kotak jawaban</div>
                    <div className="space-y-2">
                      {(normalizedQuestion.dropTargets || []).map((target) => (
                        <div
                          key={target.key}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggingValue) {
                              setPlacements((prev) => ({ ...prev, [target.key]: draggingValue }));
                              setDraggingValue(null);
                            }
                          }}
                          className="rounded-xl border border-dashed border-slate-600 bg-slate-900/60 p-3 text-sm text-slate-50"
                        >
                          <div className="text-[11px] uppercase tracking-wide text-slate-400">{target.label}</div>
                          {placements[target.key] ? (
                            <div className="mt-1 rounded-lg border border-emerald-400/60 bg-emerald-500/15 px-2 py-1 text-emerald-100">
                              {normalizedQuestion.options.find((opt) => opt.value === placements[target.key])?.label ?? placements[target.key]}
                            </div>
                          ) : (
                            <div className="mt-1 rounded-lg border border-slate-700 bg-slate-800/60 px-2 py-1 text-[12px] text-slate-400">
                              {target.placeholder ?? "Seret jawaban ke sini"}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
                      <span>{Object.values(placements).length}/{normalizedQuestion.dropTargets?.length ?? 0} kotak terisi.</span>
                      <button
                        type="button"
                        disabled={loading || !normalizedQuestion.dropTargets?.every((target) => placements[target.key])}
                        onClick={() =>
                          handleAnswer(
                            JSON.stringify(
                              normalizedQuestion.dropTargets?.reduce(
                                (acc, target) => ({ ...acc, [target.key]: placements[target.key] ?? "" }),
                                {}
                              ) || {}
                            )
                          )
                        }
                        className="rounded-xl border border-cyan-400/70 bg-cyan-500/25 px-3 py-2 font-semibold text-cyan-50 shadow-md shadow-cyan-500/30 transition hover:-translate-y-px hover:bg-cyan-500/35 disabled:opacity-60"
                      >
                        Kirim jawaban
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {feedback.message && (
            <div
              className={`relative z-10 mt-4 rounded-xl px-3 py-2 text-xs ${
                feedback.isCorrect === null
                  ? "bg-yellow-500/15 text-yellow-100 border border-yellow-500/40"
                  : feedback.isCorrect
                  ? "bg-emerald-500/15 text-emerald-100 border border-emerald-500/40"
                  : "bg-red-500/15 text-red-100 border border-red-500/40"
              }`}
            >
              {feedback.message}
            </div>
          )}

          {lockedMessage && (
            <div className="relative z-10 mt-3 rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
              {lockedMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
