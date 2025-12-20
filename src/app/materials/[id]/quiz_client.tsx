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

type AttemptStats = {
  totalAnswered: number;
  correct: number;
};

type ApiAttemptRow = {
  attempt_number: number;
  total_answered: number;
  correct: number;
  wrong: number;
  score: number;
};

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
  const [maxUnlockedNumber, setMaxUnlockedNumber] = useState(
    initialLastNumber > 0 ? initialLastNumber + 1 : 1
  );

  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean | null;
    message: string | null;
  }>({ isCorrect: null, message: null });

  const [lockedMessage, setLockedMessage] = useState<string | null>(null);

  const [essayAnswer, setEssayAnswer] = useState("");
  const [draggingValue, setDraggingValue] = useState<string | null>(null);
  const [placements, setPlacements] = useState<Record<string, string>>({});

  // status benar/salah tiap soal di percobaan aktif (buat warna bubble)
  const [questionResults, setQuestionResults] = useState<
    Record<number, "correct" | "wrong">
  >({});

  // riwayat percobaan dari database (1,2)
  const [attemptHistory, setAttemptHistory] = useState<
    Record<number, AttemptStats>
  >({});

  // percobaan yang sedang aktif (dipakai saat menjawab)
  const [attemptNumber, setAttemptNumber] = useState<1 | 2>(1);

  // percobaan mana yang sedang dilihat di UI ringkasan
  const [activeAttemptView, setActiveAttemptView] = useState<number | null>(
    null
  );

  const [loadingAttempts, setLoadingAttempts] = useState<boolean>(true);
  const [hasSavedThisAttempt, setHasSavedThisAttempt] =
    useState<boolean>(false);

  const totalQuestions = questions.length;

  // -------------------------------
  // Sync posisi soal dengan progress server
  // -------------------------------
  useEffect(() => {
    const startNumber = initialLastNumber > 0 ? initialLastNumber + 1 : 1;
    setCurrentNumber(startNumber);
    setMaxUnlockedNumber(startNumber);
  }, [initialLastNumber, userId]);

  // -------------------------------
  // Ambil riwayat percobaan dari DB
  // -------------------------------
  useEffect(() => {
    let isMounted = true;

    async function loadAttempts() {
      try {
        setLoadingAttempts(true);
        const res = await fetch(
          `/api/materials/${materialId}/attempt-summary`,
          { method: "GET" }
        );
        if (!res.ok) {
          console.error("Failed to fetch attempt summary", await res.text());
          return;
        }
        const data: { attempts: ApiAttemptRow[] } = await res.json();

        if (!isMounted) return;

        const map: Record<number, AttemptStats> = {};
        for (const row of data.attempts || []) {
          const num = row.attempt_number;
          if (!num) continue;
          map[num] = {
            totalAnswered: row.total_answered ?? 0,
            correct: row.correct ?? 0,
          };
        }

        setAttemptHistory(map);

        const attemptNumbers = Object.keys(map).map((n) => Number(n));
        if (attemptNumbers.includes(2)) {
          setAttemptNumber(2);
          setActiveAttemptView(2);
          // kalau sudah habis soalnya, currentNumber sudah > totalQuestions
        } else if (attemptNumbers.includes(1)) {
          setAttemptNumber(2); // siap untuk percobaan 2 berikutnya
          setActiveAttemptView(1);
        } else {
          setAttemptNumber(1);
          setActiveAttemptView(null);
        }
      } catch (err) {
        console.error("loadAttempts error:", err);
      } finally {
        if (isMounted) setLoadingAttempts(false);
      }
    }

    loadAttempts();

    return () => {
      isMounted = false;
    };
  }, [materialId]);

  // reset flag penyimpanan ketika ganti percobaan
  useEffect(() => {
    setHasSavedThisAttempt(false);
  }, [attemptNumber, userId, materialId]);

  // -------------------------------
  // Normalisasi soal
  // -------------------------------
  const currentQuestion = questions.find(
    (q) => q.question_number === currentNumber
  );

  const normalizedQuestion: NormalizedQuestion | null = useMemo(() => {
    if (!currentQuestion) return null;

    let parsed: StructuredQuestion | null = null;
    try {
      const json = JSON.parse(currentQuestion.text);
      if (json && typeof json === "object") {
        parsed = json as StructuredQuestion;
      }
    } catch {
      // text biasa
    }

    const basePrompt = parsed?.prompt ?? currentQuestion.text;

    const normalizedOptions: QuestionOption[] = (currentQuestion.options || [])
      .map((opt) => {
        if (typeof opt === "string") {
          return { value: opt, label: opt } satisfies QuestionOption;
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
      normalizedOptions.some((o) => !!o.targetKey) ||
      !!parsed?.dropTargets?.length;

    const dropTargets = hasDropTargets
      ? parsed?.dropTargets ??
        Array.from(
          new Set(
            normalizedOptions
              .map((o) => o.targetKey)
              .filter((v): v is string => !!v)
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
    };
  }, [currentQuestion]);

  // reset jawaban tiap ganti soal
  useEffect(() => {
    setEssayAnswer("");
    setPlacements({});
    setDraggingValue(null);
    setFeedback({ isCorrect: null, message: null });
    setLockedMessage(null);
  }, [currentQuestion?.id]);

  const isLockedPremium =
    !isPremium && (currentQuestion?.question_number ?? 0) > FREE_LIMIT;

  // -------------------------------
  // Jika sudah tidak ada currentQuestion → mode ringkasan
  // -------------------------------

  useEffect(() => {
    // kalau masih loading attempt dari server, jangan simpan apa-apa dulu
    if (loadingAttempts) return;
    // kalau masih ada soal, berarti belum selesai
    if (currentQuestion) return;

    const summary = attemptHistory[attemptNumber];
    if (!summary || summary.totalAnswered === 0) return;
    if (hasSavedThisAttempt) return;

    async function saveAttemptSummary() {
      try {
        await fetch(`/api/materials/${materialId}/attempt-summary`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attemptNumber,
            correct: summary.correct,
            totalAnswered: summary.totalAnswered,
          }),
        });
        setHasSavedThisAttempt(true);
      } catch (err) {
        console.error("Failed to save attempt summary:", err);
      }
    }

    saveAttemptSummary();
  }, [
    currentQuestion,
    attemptHistory,
    attemptNumber,
    materialId,
    hasSavedThisAttempt,
    loadingAttempts,
  ]);

  if (!currentQuestion || !normalizedQuestion) {
    // MODE RINGKASAN
    if (loadingAttempts) {
      return (
        <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/90 p-4 text-sm text-slate-200">
          Memuat riwayat percobaan...
        </div>
      );
    }

    const attemptNumbers = Object.keys(attemptHistory).map((n) => Number(n));
    const hasAnyAttempt = attemptNumbers.length > 0;
    const attempt1 = attemptHistory[1];
    const attempt2 = attemptHistory[2];
    const hasAttempt1 = !!attempt1;
    const hasAttempt2 = !!attempt2;

    // Belum ada data sama sekali di DB → ajak mulai percobaan 1
    if (!hasAnyAttempt) {
      function handleStartAttempt1() {
        setAttemptNumber(1);
        setQuestionResults({});
        setCurrentNumber(1);
        setMaxUnlockedNumber(1);
        setActiveAttemptView(null);
        setFeedback({ isCorrect: null, message: null });
        setLockedMessage(null);
      }

      return (
        <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/90 p-4 text-sm text-slate-50 shadow-xl shadow-black/40">
          <h2 className="mb-2 text-lg font-bold text-emerald-300">
            Belum ada data percobaan tersimpan
          </h2>
          <p className="mb-4 text-xs text-slate-200">
            Silakan mulai Percobaan 1 untuk materi ini. Setelah kamu
            menyelesaikan semua soal, hasilnya akan otomatis tersimpan di
            server.
          </p>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <Link
              href="/dashboard/student"
              className="rounded-xl border border-cyan-400/70 bg-cyan-500/20 px-3 py-2 font-semibold text-cyan-100 hover:bg-cyan-500/40"
            >
              ⬅️ Kembali ke Dashboard
            </Link>
            <button
              type="button"
              onClick={handleStartAttempt1}
              className="rounded-xl border border-emerald-400/70 bg-emerald-500/20 px-3 py-2 font-semibold text-emerald-100 hover:bg-emerald-500/40"
            >
              ▶ Mulai percobaan 1
            </button>
          </div>
        </div>
      );
    }

    const defaultViewAttempt =
      activeAttemptView && attemptHistory[activeAttemptView]
        ? activeAttemptView
        : Math.max(...attemptNumbers);

    const viewAttempt = defaultViewAttempt;
    const stats = attemptHistory[viewAttempt] ?? {
      totalAnswered: 0,
      correct: 0,
    };

    const answered = stats.totalAnswered;
    const correct = stats.correct;
    const wrong = Math.max(0, answered - correct);
    const score = answered > 0 ? Math.round((correct / answered) * 100) : 0;

    let messageTitle = `Keren, kamu sudah menyelesaikan percobaan ${viewAttempt}! 🎉`;
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

    function handleStartAttempt2() {
      if (!hasAttempt1 || hasAttempt2) return;
      setAttemptNumber(2);
      setQuestionResults({});
      setCurrentNumber(1);
      setMaxUnlockedNumber(1);
      setActiveAttemptView(null);
      setFeedback({ isCorrect: null, message: null });
      setLockedMessage(null);
    }

    return (
      <div className="mt-6 rounded-2xl border border-emerald-500/40 bg-slate-900/90 p-4 text-sm text-slate-50 shadow-xl shadow-black/40">
        <h2 className="mb-1 text-lg font-bold text-emerald-300">
          {messageTitle}
        </h2>
        <p className="mb-3 whitespace-pre-line text-xs text-slate-200">
          {messageBody}
        </p>

        {/* tombol pilih percobaan yang ingin dilihat */}
        <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
          {hasAttempt1 && (
            <button
              type="button"
              onClick={() => setActiveAttemptView(1)}
              className={`rounded-full border px-3 py-1 font-semibold ${
                viewAttempt === 1
                  ? "border-emerald-400 bg-emerald-500/30 text-emerald-50"
                  : "border-slate-600 bg-slate-800 text-slate-100"
              }`}
            >
              🔍 Lihat percobaan 1
            </button>
          )}
          {hasAttempt2 && (
            <button
              type="button"
              onClick={() => setActiveAttemptView(2)}
              className={`rounded-full border px-3 py-1 font-semibold ${
                viewAttempt === 2
                  ? "border-cyan-400 bg-cyan-500/30 text-cyan-50"
                  : "border-slate-600 bg-slate-800 text-slate-100"
              }`}
            >
              🔍 Lihat percobaan 2
            </button>
          )}
        </div>

        {/* ringkasan percobaan yang sedang dilihat */}
        <div className="mb-3 grid grid-cols-3 gap-2 text-[11px]">
          <div className="rounded-xl bg-slate-800/80 p-2 text-center">
            <div className="text-slate-400">Benar</div>
            <div className="text-lg font-bold text-emerald-300">{correct}</div>
          </div>
          <div className="rounded-xl bg-slate-800/80 p-2 text-center">
            <div className="text-slate-400">Salah</div>
            <div className="text-lg font-bold text-rose-300">{wrong}</div>
          </div>
          <div className="rounded-xl bg-slate-800/80 p-2 text-center">
            <div className="text-slate-400">Total dijawab</div>
            <div className="text-lg font-bold text-slate-100">{answered}</div>
          </div>
        </div>

        <div className="mb-4 text-[11px] text-slate-200">
          Nilai percobaan {viewAttempt}:{" "}
          <span className="font-bold text-emerald-300">{score}%</span>
        </div>

        {/* ringkasan percobaan 1 & 2 berdampingan */}
        <div className="mb-4 grid gap-2 text-[11px] sm:grid-cols-2">
          {hasAttempt1 && (
            <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-3">
              <div className="mb-1 font-semibold text-slate-100">
                Percobaan 1
              </div>
              <div>Benar: {attempt1.correct}</div>
              <div>
                Salah: {Math.max(0, attempt1.totalAnswered - attempt1.correct)}
              </div>
              <div>
                Nilai:{" "}
                {Math.round(
                  (attempt1.correct / Math.max(1, attempt1.totalAnswered)) * 100
                )}
                %
              </div>
            </div>
          )}

          {hasAttempt2 && (
            <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-3">
              <div className="mb-1 font-semibold text-slate-100">
                Percobaan 2
              </div>
              <div>Benar: {attempt2.correct}</div>
              <div>
                Salah: {Math.max(0, attempt2.totalAnswered - attempt2.correct)}
              </div>
              <div>
                Nilai:{" "}
                {Math.round(
                  (attempt2.correct / Math.max(1, attempt2.totalAnswered)) * 100
                )}
                %
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-[11px]">
          <Link
            href="/dashboard/student"
            className="rounded-xl border border-cyan-400/70 bg-cyan-500/20 px-3 py-2 font-semibold text-cyan-100 hover:bg-cyan-500/40"
          >
            ⬅️ Kembali ke Dashboard
          </Link>

          {!hasAttempt2 && hasAttempt1 && (
            <button
              type="button"
              onClick={handleStartAttempt2}
              className="rounded-xl border border-emerald-400/70 bg-emerald-500/20 px-3 py-2 font-semibold text-emerald-100 hover:bg-emerald-500/40"
            >
              🔁 Mulai percobaan 2
            </button>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------
  // MODE KERJAKAN SOAL
  // -------------------------------

  async function handleAnswer(selected: string) {
    if (!currentQuestion) return;

    setLoadingAnswer(true);
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
          attemptNumber,
        }),
      });

      const data = await res.json();

      if (data.locked && !isPremium) {
        setLockedMessage(
          data.message ||
            "Soal ini terkunci. Untuk lanjut, silakan hubungi guru / admin."
        );
        return;
      }

      const isCorrect: boolean = !!data.isCorrect;
      const correctAnswer: string | undefined = data.correctAnswer;
      const explanation: string | undefined = data.explanation ?? undefined;

      // tandai soal ini benar / salah untuk bubble
      setQuestionResults((prev) => ({
        ...prev,
        [currentQuestion.id]: isCorrect ? "correct" : "wrong",
      }));

      // update statistik percobaan aktif (di memori)
      setAttemptHistory((prevHistory) => {
        const prevSummary = prevHistory[attemptNumber] ?? {
          totalAnswered: 0,
          correct: 0,
        };
        const updated: AttemptStats = {
          totalAnswered: prevSummary.totalAnswered + 1,
          correct: prevSummary.correct + (isCorrect ? 1 : 0),
        };
        return { ...prevHistory, [attemptNumber]: updated };
      });

      let message = "";
      if (isCorrect) {
        message = "Mantap! Jawaban kamu benar 😄";
        if (explanation) message += `\nPenjelasan: ${explanation}`;
      } else {
        if (correctAnswer) {
          message = `Belum tepat. Jawaban yang benar: ${correctAnswer}`;
        } else {
          message =
            "Belum tepat. Jawabanmu tercatat, lanjut ke soal berikutnya ya.";
        }
        if (explanation) message += `\nPenjelasan: ${explanation}`;
      }

      setFeedback({ isCorrect, message });

      // SELALU lanjut ke soal berikutnya
      setTimeout(() => {
        setFeedback({ isCorrect: null, message: null });
        setEssayAnswer("");
        setPlacements({});
        setDraggingValue(null);

        setCurrentNumber((prev) => {
          const next = prev + 1;
          setMaxUnlockedNumber((prevMax) => Math.max(prevMax, next));
          return next;
        });
      }, 900);
    } catch (err) {
      console.error(err);
      setFeedback({
        isCorrect: null,
        message: "Ups, terjadi error saat mengirim jawaban.",
      });
    } finally {
      setLoadingAnswer(false);
    }
  }

  // UI saat mengerjakan soal
  return (
    <div className="mt-6">
      {/* header info soal */}
      <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-3 text-xs text-slate-200 shadow-lg shadow-black/40 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500/40 via-purple-500/30 to-emerald-400/30 text-base font-bold text-white shadow-md shadow-cyan-500/30">
            {currentQuestion.question_number}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-400">
            Soal untukmu
          </div>
          <div className="font-semibold text-white">
            {currentQuestion.question_number}/{totalQuestions} •{" "}
            {normalizedQuestion.type === "essay"
              ? "Jawab bebas"
              : normalizedQuestion.type === "drag_drop"
              ? "Seret & jatuhkan"
              : "Pilih jawaban"}
          </div>
        </div>
      </div>

      {/* Progress bar + badge gratis / premium */}
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-linear-to-r from-cyan-400 via-purple-400 to-pink-400"
            style={{
              width: `${Math.min(
                100,
                Math.round(
                  (currentQuestion.question_number /
                    Math.max(totalQuestions, 1)) *
                    100
                )
              )}%`,
            }}
          />
        </div>

        <div className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px]">
          {currentQuestion.question_number <= FREE_LIMIT ? (
            <span className="text-emerald-300">Gratis 🎁</span>
          ) : isPremium ? (
            <span className="text-amber-300">Premium (terbuka) ⭐</span>
          ) : (
            <span className="text-yellow-300">Premium 🔒</span>
          )}
        </div>
      </div>

      {/* bubble navigasi soal */}
      <nav className="mb-3 flex flex-wrap justify-center gap-1.5 sm:gap-2">
        {questions.map((qq) => {
          const isCurrent = qq.question_number === currentNumber;
          const unlocked = qq.question_number <= maxUnlockedNumber;
          const status = questionResults[qq.id];

          let cls =
            "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold border transition-colors";

          if (isCurrent) {
            cls +=
              " bg-pink-500 border-pink-300 text-white shadow-[0_0_14px_rgba(236,72,153,0.9)]";
          } else if (status === "correct") {
            cls +=
              " bg-emerald-500/40 border-emerald-300 text-emerald-50 shadow-[0_0_14px_rgba(16,185,129,0.85)]";
          } else if (status === "wrong") {
            cls +=
              " bg-rose-500/35 border-rose-300 text-rose-50 shadow-[0_0_14px_rgba(244,63,94,0.85)]";
          } else if (unlocked) {
            cls +=
              " bg-slate-800 border-slate-600 text-slate-100 hover:border-cyan-400 hover:text-cyan-100";
          } else {
            cls += " bg-slate-900 border-slate-800 text-slate-600";
          }

          return (
            <button
              key={qq.id}
              type="button"
              disabled={!unlocked}
              onClick={() => {
                if (!unlocked) return;
                setCurrentNumber(qq.question_number);
              }}
              className={cls}
            >
              {qq.question_number}
            </button>
          );
        })}
      </nav>

      {/* kartu soal utama */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl shadow-black/40">
        <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-linear-to-tr from-cyan-500/25 via-purple-500/25 to-pink-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-16 h-32 w-32 rounded-full bg-linear-to-br from-emerald-500/25 via-cyan-500/25 to-indigo-500/25 blur-3xl" />

        <div className="relative z-10 space-y-3">
          {/* Teks & gambar soal */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">
                {normalizedQuestion.prompt}
              </p>
              {normalizedQuestion.helperText && (
                <p className="text-[11px] text-slate-300">
                  {normalizedQuestion.helperText}
                </p>
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

          {/* jika premium lock */}
          {isLockedPremium ? (
            <div className="relative z-10 rounded-xl border border-yellow-400/50 bg-yellow-500/15 p-3 text-xs text-yellow-100">
              <p className="mb-1 font-semibold">Soal premium 🔒</p>
              <p className="text-[11px] text-yellow-100">
                Kamu sudah menyelesaikan semua soal gratis. Untuk membuka soal
                berikutnya, silakan hubungi guru / admin untuk upgrade paket ya.
                🙂
              </p>
            </div>
          ) : (
            <>
              {/* Multiple choice */}
              {normalizedQuestion.type === "multiple_choice" && (
                <div className="grid gap-2 md:grid-cols-2">
                  {normalizedQuestion.options.map((opt) => (
                    <button
                      key={opt.value}
                      disabled={loadingAnswer}
                      onClick={() => handleAnswer(opt.value)}
                      className="group relative w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/80 px-3 py-3 text-left text-sm text-slate-50 transition hover:-translate-y-0.5 hover:border-cyan-400 hover:bg-slate-800 hover:shadow-md hover:shadow-cyan-500/30 disabled:opacity-60"
                    >
                      {opt.imageUrl && (
                        <div className="mb-2 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
                          <img
                            src={opt.imageUrl}
                            alt={opt.label}
                            className="h-32 w-full object-contain"
                          />
                        </div>
                      )}
                      <span className="font-semibold text-white">
                        {opt.label}
                      </span>
                      <div className="pointer-events-none absolute -bottom-6 -right-8 h-16 w-16 rounded-full bg-linear-to-tr from-cyan-500/20 via-purple-500/20 to-pink-500/20 blur-xl" />
                    </button>
                  ))}
                </div>
              )}

              {/* Essay */}
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
                    <span>
                      Ekspresikan jawaban dengan bahasamu sendiri. Kamu boleh
                      menulis langkah-langkahnya.
                    </span>
                    <button
                      type="button"
                      disabled={loadingAnswer || !essayAnswer.trim()}
                      onClick={() => handleAnswer(essayAnswer.trim())}
                      className="rounded-xl border border-emerald-400/70 bg-emerald-500/30 px-3 py-2 font-semibold text-emerald-50 shadow-md shadow-emerald-500/30 transition hover:-translate-y-px hover:bg-emerald-500/40 disabled:opacity-60"
                    >
                      Kirim jawaban
                    </button>
                  </div>
                </div>
              )}

              {/* Drag & drop */}
              {normalizedQuestion.type === "drag_drop" && (
                <div className="grid gap-4 md:grid-cols-[1.4fr,1fr]">
                  <div className="space-y-2">
                    <div className="grid gap-2 md:grid-cols-2">
                      {normalizedQuestion.options.map((opt) => {
                        const isUsed = Object.values(placements).includes(
                          opt.value
                        );
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
                                <img
                                  src={opt.imageUrl}
                                  alt={opt.label}
                                  className="h-24 w-full object-contain"
                                />
                              </div>
                            )}
                            <div className="font-semibold">{opt.label}</div>
                            <div className="pointer-events-none absolute -bottom-6 -right-10 h-16 w-16 rounded-full bg-linear-to-tr from-cyan-500/15 via-purple-500/15 to-pink-500/15 blur-xl" />
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Seret kartu ke kotak jawaban yang tepat. Kamu dapat
                      mengganti pilihan dengan menyeret ulang.
                    </p>
                  </div>

                  <div className="space-y-2 rounded-2xl border border-slate-700 bg-slate-800/80 p-3 shadow-inner shadow-black/30">
                    <div className="text-[11px] font-semibold text-cyan-200">
                      Kotak jawaban
                    </div>

                    <div className="space-y-2">
                      {(normalizedQuestion.dropTargets || []).map((target) => (
                        <div
                          key={target.key}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggingValue) {
                              setPlacements((prev) => ({
                                ...prev,
                                [target.key]: draggingValue!,
                              }));
                              setDraggingValue(null);
                            }
                          }}
                          className="rounded-xl border border-dashed border-slate-600 bg-slate-900/60 p-3 text-sm text-slate-50"
                        >
                          <div className="text-[11px] uppercase tracking-wide text-slate-400">
                            {target.label}
                          </div>

                          {placements[target.key] ? (
                            <div className="mt-1 rounded-lg border border-emerald-400/60 bg-emerald-500/15 px-2 py-1 text-emerald-100">
                              {normalizedQuestion.options.find(
                                (opt) => opt.value === placements[target.key]
                              )?.label ?? placements[target.key]}
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
                      <span>
                        {Object.values(placements).length}/
                        {normalizedQuestion.dropTargets?.length ?? 0} kotak
                        terisi.
                      </span>

                      <button
                        type="button"
                        disabled={
                          loadingAnswer ||
                          !normalizedQuestion.dropTargets?.every(
                            (target) => placements[target.key]
                          )
                        }
                        onClick={() =>
                          handleAnswer(
                            JSON.stringify(
                              normalizedQuestion.dropTargets?.reduce(
                                (acc, target) => ({
                                  ...acc,
                                  [target.key]: placements[target.key] ?? "",
                                }),
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

          {/* feedback jawaban */}
          {feedback.message && (
            <div
              className={`relative z-10 mt-4 rounded-xl px-3 py-2 text-xs ${
                feedback.isCorrect === null
                  ? "border border-yellow-500/40 bg-yellow-500/15 text-yellow-100"
                  : feedback.isCorrect
                  ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-100"
                  : "border border-rose-500/40 bg-rose-500/15 text-rose-100"
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
