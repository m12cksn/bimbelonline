// app/materials/[id]/quiz_client.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type QuestionOption = {
  value: string;
  label: string;
  imageUrl?: string;
};

type RawOption = string | QuestionOption;

type Question = {
  id: number;
  question_number: number;
  text: string;
  options: RawOption[] | null;
};

interface Props {
  materialId: number;
  questions: Question[];
  initialLastNumber: number;
  isPremium: boolean;
}

const FREE_LIMIT = 8;
const MAX_MATERIAL_ATTEMPTS = 2;

export default function MaterialQuiz({
  materialId,
  questions,
  initialLastNumber,
  isPremium,
}: Props) {
  // index = posisi di array questions (0-based)
  const [index, setIndex] = useState(
    initialLastNumber > 0 ? initialLastNumber : 0
  );

  const [selected, setSelected] = useState<string | null>(null);

  // status per soal di percobaan ini: correct / wrong
  const [bubble, setBubble] = useState<
    Record<number, "correct" | "wrong" | null | undefined>
  >({});

  // lock dari server (premium / max_attempts)
  const [serverLockPremium, setServerLockPremium] = useState(false);
  const [materialLocked, setMaterialLocked] = useState(false);

  // feedback penjelasan untuk soal yang baru saja dijawab
  const [feedback, setFeedback] = useState<{
    state: "correct" | "wrong" | null;
    msg: string | null;
  }>({ state: null, msg: null });

  // tracking percobaan per materi
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [attemptScores, setAttemptScores] = useState<number[]>([]); // misal [score percobaan1]
  const [bestSavedScore, setBestSavedScore] = useState<number | null>(null);
  const [attemptsLoaded, setAttemptsLoaded] = useState(false);
  const [savingAttempt, setSavingAttempt] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasRecordedCurrentAttempt, setHasRecordedCurrentAttempt] =
    useState(false);
  const [autoSaveTriggered, setAutoSaveTriggered] = useState(false);

  const totalQuestions = questions.length;
  const q = questions[index];

  // index soal terakhir yang sudah dijawab (untuk lock navigasi)
  const maxAnsweredIndex = questions.reduce((max, qq, i) => {
    if (bubble[qq.id]) return Math.max(max, i);
    return max;
  }, -1);

  // index paling jauh yang boleh dibuka (soal berikutnya setelah yg sudah dijawab)
  const unlockedIndex = maxAnsweredIndex + 1;

  // premium lock berdasarkan nomor soal & status subscription
  const numberLocked = !isPremium && q && q.question_number > FREE_LIMIT;

  const isLocked = numberLocked || serverLockPremium || materialLocked;

  const loadAttempts = useCallback(
    async (options?: { preserveAttemptNumber?: boolean }) => {
      const preserveAttemptNumber = options?.preserveAttemptNumber ?? false;
      try {
        setAttemptsLoaded(false);
        const res = await fetch(`/api/materials/${materialId}/attempts`);
        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(data.error || "Gagal memuat riwayat percobaan");
        }

        const scores = (data.attempts ?? []).map(
          (row: { score: number | null }) => row.score ?? 0
        );

        setAttemptScores(scores);
        if (!preserveAttemptNumber) {
          setAttemptNumber(
            scores.length >= MAX_MATERIAL_ATTEMPTS
              ? MAX_MATERIAL_ATTEMPTS
              : scores.length + 1
          );
        }
        setBestSavedScore(data.bestScore ?? null);
        setMaterialLocked(scores.length >= MAX_MATERIAL_ATTEMPTS);
        setIndex(
          scores.length > 0
            ? 0 // mulai ulang dari soal 1 setelah percobaan sebelumnya selesai
            : initialLastNumber > 0
            ? initialLastNumber
            : 0
        );
        setSaveError(null);
      } catch (err) {
        console.error("loadAttempts error", err);
        setSaveError(
          err instanceof Error ? err.message : "Gagal memuat riwayat percobaan"
        );
      } finally {
        setAttemptsLoaded(true);
      }
    },
    [initialLastNumber, materialId]
  );

  useEffect(() => {
    loadAttempts();
  }, [loadAttempts]);

  // normalisasi options
  const options = useMemo(() => {
    if (!q?.options) return [];
    return q.options.map((op) => {
      if (typeof op === "string") return { value: op, label: op };
      return op as QuestionOption;
    });
  }, [q]);

  const hasAnsweredCurrent = q ? !!bubble[q.id] : false;

  const attemptResult = useMemo(() => {
    const values = Object.values(bubble).filter(
      (v): v is "correct" | "wrong" => !!v
    );
    const correctCount = values.filter((v) => v === "correct").length;
    const total = totalQuestions;
    const wrongCount = Math.max(0, total - correctCount);
    const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    return { correctCount, wrongCount, total, score };
  }, [bubble, totalQuestions]);

  const recordedScores = attemptScores.filter(
    (score): score is number => typeof score === "number"
  );
  const knownBestScore = Math.max(0, bestSavedScore ?? 0, ...recordedScores);

  // pindah ke soal berikutnya
  function goNext() {
    if (!q) return;
    if (!hasAnsweredCurrent) return; // wajib sudah jawab

    if (index < totalQuestions - 1) {
      setIndex(index + 1);
      setSelected(null);
      setFeedback({ state: null, msg: null });
    } else {
      // selesai → masuk ke mode review
      setIndex(totalQuestions);
      setSelected(null);
      setFeedback({ state: null, msg: null });
      setHasRecordedCurrentAttempt(false);
      setAutoSaveTriggered(false);
    }
  }

  const persistAttempt = useCallback(async () => {
    if (hasRecordedCurrentAttempt) return;
    if (totalQuestions === 0) return;

    setAutoSaveTriggered(true);
    setSavingAttempt(true);
    setSaveError(null);

    try {
      const res = await fetch(`/api/materials/${materialId}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correctCount: attemptResult.correctCount,
          wrongCount: attemptResult.wrongCount,
          totalQuestions,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || data.message || "Gagal menyimpan nilai");
      }

      setHasRecordedCurrentAttempt(true);
      await loadAttempts({ preserveAttemptNumber: true });
    } catch (err) {
      console.error("persistAttempt error", err);
      setSaveError(
        err instanceof Error ? err.message : "Gagal menyimpan nilai percobaan"
      );
    } finally {
      setSavingAttempt(false);
    }
  }, [
    attemptResult.correctCount,
    attemptResult.wrongCount,
    hasRecordedCurrentAttempt,
    loadAttempts,
    materialId,
    totalQuestions,
  ]);

  useEffect(() => {
    if (!attemptsLoaded) return;
    if (index < totalQuestions || totalQuestions === 0) return;
    if (materialLocked) return;
    if (hasRecordedCurrentAttempt) return;
    if (autoSaveTriggered) return;

    setAutoSaveTriggered(true);
    persistAttempt();
  }, [
    autoSaveTriggered,
    attemptsLoaded,
    hasRecordedCurrentAttempt,
    index,
    materialLocked,
    persistAttempt,
    totalQuestions,
  ]);

  if (!attemptsLoaded) {
    return (
      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-xs text-slate-200">
        Memuat progres & riwayat percobaan...
      </div>
    );
  }

  // SUBMIT jawaban (satu kali per soal per percobaan)
  async function submit() {
    if (!selected || !q) return;
    if (materialLocked) return;

    // soal ini sudah tercatat → jangan dihitung ulang
    if (bubble[q.id]) return;

    const res = await fetch(`/api/materials/${materialId}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionId: q.id,
        questionNumber: q.question_number,
        selectedAnswer: selected,
      }),
    });

    const data = await res.json();

    // jika API mengunci (premium / max attempts)
    if (data.locked) {
      if (data.reason === "max_material_attempts") {
        setMaterialLocked(true);
      } else {
        setServerLockPremium(true);
      }
      return;
    }

    const correct = !!data.isCorrect;
    const correctAnswer: string | undefined = data.correctAnswer ?? undefined;
    const explanation: string | undefined = data.explanation ?? undefined;

    // catat status bubble: benar / salah
    setBubble((b) => ({
      ...b,
      [q.id]: correct ? "correct" : "wrong",
    }));

    // buat pesan penjelasan
    let msg = "";

    if (correct) {
      msg = "Mantap! Jawaban kamu benar. 🎉";
      if (explanation) {
        msg += `\nPenjelasan: ${explanation}`;
      }
    } else {
      if (correctAnswer) {
        msg = `Belum tepat. Jawaban yang benar: ${correctAnswer}.`;
      } else {
        msg = "Belum tepat. Jawaban kamu salah.";
      }
      if (explanation) {
        msg += `\nPenjelasan: ${explanation}`;
      }
    }

    setFeedback({
      state: correct ? "correct" : "wrong",
      msg,
    });
  }

  // ----------------- REVIEW PAGE -------------------
  if (index >= totalQuestions && totalQuestions > 0) {
    const { correctCount: correct, wrongCount: wrong, score, total } =
      attemptResult;

    const firstAttemptScore = recordedScores[0];
    const bestOverall = Math.max(score, knownBestScore);

    const canRetry = attemptNumber < MAX_MATERIAL_ATTEMPTS;

    function handleRetry() {
      if (!canRetry) return;

      // Pastikan skor percobaan ini tetap tercatat secara lokal
      setAttemptScores((prev) => {
        const next = [...prev];
        const slot = attemptNumber - 1;
        if (slot >= 0 && !next[slot]) {
          next[slot] = score;
        }
        return next.slice(0, MAX_MATERIAL_ATTEMPTS);
      });

      setAttemptNumber((prev) => prev + 1);
      setIndex(0);
      setBubble({});
      setSelected(null);
      setFeedback({ state: null, msg: null });
      setServerLockPremium(false);
      setMaterialLocked(false);
      setHasRecordedCurrentAttempt(false);
      setAutoSaveTriggered(false);
    }

    return (
      <div className="mt-6 rounded-xl border border-emerald-500/40 bg-slate-900/80 p-4 text-slate-100 text-xs">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-lg">🎉</span>
          <h1 className="text-base font-bold text-emerald-300">
            Selesai! (Percobaan {attemptNumber} dari {MAX_MATERIAL_ATTEMPTS})
          </h1>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-slate-800/80 p-2 text-center">
            <p className="text-[10px] text-slate-300">Benar</p>
            <p className="text-lg font-bold text-emerald-300">{correct}</p>
          </div>
          <div className="rounded-xl bg-slate-800/80 p-2 text-center">
            <p className="text-[10px] text-slate-300">Salah</p>
            <p className="text-lg font-bold text-red-300">{wrong}</p>
          </div>
          <div className="rounded-xl bg-slate-800/80 p-2 text-center">
            <p className="text-[10px] text-slate-300">Total</p>
            <p className="text-lg font-bold text-slate-100">{total}</p>
          </div>
        </div>

        {savingAttempt && (
          <p className="mb-2 text-[11px] text-cyan-200">
            Menyimpan nilai percobaan ke server...
          </p>
        )}

        {saveError && (
          <p className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-[11px] text-red-100">
            {saveError}
          </p>
        )}

        {/* Nilai percobaan sekarang */}
        <p className="mb-1 text-sm">
          Nilai percobaan {attemptNumber}:{" "}
          <span className="font-bold text-lime-300">{score}%</span>
        </p>

        {/* Rekap percobaan 1 & 2 */}
        {firstAttemptScore != null && attemptNumber === 2 && (
          <p className="mb-1 text-xs text-slate-300">
            • Percobaan 1:{" "}
            <span className="font-semibold text-emerald-300">
              {firstAttemptScore}%
            </span>{" "}
            • Percobaan 2:{" "}
            <span className="font-semibold text-cyan-300">{score}%</span>
          </p>
        )}
        {recordedScores.length > 0 && (
          <p className="mb-1 text-[11px] text-slate-300">
            Nilai tersimpan: Percobaan 1 {recordedScores[0] ?? "-"}%
            {recordedScores.length > 1 && (
              <>
                {" "}
                • Percobaan 2 {recordedScores[1] ?? "-"}%
              </>
            )}
          </p>
        )}

        {/* Nilai terbaik */}
        <p className="mb-4 text-xs text-slate-300">
          Nilai terbaik sementara:{" "}
          <span className="font-semibold text-emerald-300">{bestOverall}%</span>{" "}
          (nilai ini yang nanti bisa dipakai di leaderboard).
        </p>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/student"
            className="inline-block rounded-xl border border-cyan-400/60 bg-cyan-500/20 px-4 py-3 text-cyan-200"
          >
            ⬅ Kembali ke Dashboard
          </Link>

          {canRetry ? (
            <button
              type="button"
              onClick={handleRetry}
              className="inline-block rounded-xl border border-emerald-400/60 bg-emerald-500/20 px-4 py-3 text-emerald-200"
            >
              🔁 Mulai percobaan ke-{attemptNumber + 1}
            </button>
          ) : (
            <p className="mt-3 text-[11px] text-slate-400">
              Kamu sudah melakukan 2x percobaan. Nilai tertinggimu akan
              digunakan untuk leaderboard.
            </p>
          )}

          {saveError && (
            <button
              type="button"
              onClick={() => {
                setAutoSaveTriggered(false);
                persistAttempt();
              }}
              className="inline-block rounded-xl border border-red-400/60 bg-red-500/10 px-4 py-3 text-red-100"
            >
              💾 Coba simpan lagi
            </button>
          )}
        </div>
      </div>
    );
  }

  if (materialLocked) {
    return (
      <div className="mt-6 rounded-xl border border-cyan-400/40 bg-slate-900/80 p-4 text-xs text-cyan-50">
        <p className="mb-1 font-bold text-cyan-200">
          Kamu sudah menyelesaikan 2x percobaan untuk materi ini.
        </p>
        <p className="mb-2 text-slate-200">
          Nilai terbaikmu:{" "}
          <span className="font-semibold text-emerald-300">
            {knownBestScore}%
          </span>
        </p>
        <p className="text-[11px] text-slate-400">
          Coba materi lainnya atau hubungi guru jika butuh reset percobaan.
        </p>
      </div>
    );
  }

  // PREMIUM BLOCK (kalau soal sekarang terkunci)
  if (isLocked) {
    return (
      <div className="mt-6 rounded-xl border border-yellow-400/50 bg-yellow-500/15 p-4 text-xs text-yellow-100">
        <p className="mb-2 font-bold">Soal Premium 🔒</p>
        Kamu telah menyelesaikan soal gratis. Untuk lanjut ke soal selanjutnya:
        <br />
        hubungi admin/guru.
      </div>
    );
  }

  // tidak ada soal sama sekali
  if (!q || totalQuestions === 0) {
    return (
      <div className="mt-6 rounded-xl border border-slate-700 bg-slate-900/80 p-4 text-xs text-slate-200">
        Belum ada soal untuk materi ini.
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Navigation Bubbles */}
      <div className="mb-4 flex flex-wrap justify-center gap-1">
        {questions.map((qq, i) => {
          const status = bubble[qq.id];
          const active = i === index;
          const unlocked = i <= unlockedIndex;

          let base =
            "w-7 h-7 rounded-full text-[10px] font-bold border transition";

          if (active) {
            base +=
              " bg-pink-500 border-pink-300 text-white shadow-[0_0_12px_rgba(236,72,153,0.75)]";
          } else if (status === "correct") {
            base += " bg-emerald-600 border-emerald-400 text-white";
          } else if (status === "wrong") {
            base += " bg-red-600 border-red-300 text-white";
          } else if (unlocked) {
            base += " bg-slate-800 border-slate-600 text-slate-300";
          } else {
            base += " bg-slate-900 border-slate-800 text-slate-600";
          }

          return (
            <button
              key={qq.id}
              disabled={!unlocked}
              onClick={() => {
                if (!unlocked) return;
                setIndex(i);
                setSelected(null);
                setFeedback({ state: null, msg: null });
              }}
              className={base}
            >
              {qq.question_number}
            </button>
          );
        })}
      </div>

      {/* CARD SOAL */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 px-5 py-6 shadow-xl shadow-black/40">
        <h1 className="mb-2 text-base font-bold text-white">
          Soal {q.question_number} • Percobaan {attemptNumber}/
          {MAX_MATERIAL_ATTEMPTS}
        </h1>

        <p className="mb-4 text-lg text-white">{q.text}</p>

        {/* Options */}
        <div className="space-y-3">
          {options.map((op) => {
            const disabled = hasAnsweredCurrent;
            return (
              <button
                key={op.value}
                disabled={disabled}
                onClick={() => !disabled && setSelected(op.value)}
                className={`block w-full rounded-2xl border px-4 py-3 text-left 
                  ${
                    disabled
                      ? "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed"
                      : selected === op.value
                      ? "bg-lime-400 text-slate-900 border-lime-300"
                      : "bg-slate-800 text-slate-100 border-slate-700 hover:border-cyan-400 hover:text-cyan-100"
                  }`}
              >
                {op.label}
              </button>
            );
          })}
        </div>

        {/* Tombol Submit + Next */}
        <div className="mt-5 flex items-center gap-2">
          <button
            onClick={submit}
            disabled={!selected || hasAnsweredCurrent}
            className={`rounded-xl px-6 py-2 text-xs shadow-[0_0_12px_rgba(236,72,153,0.8)]
              ${
                !selected || hasAnsweredCurrent
                  ? "bg-pink-500/40 text-white/60 cursor-not-allowed"
                  : "bg-pink-500 text-white"
              }`}
          >
            Submit
          </button>

          <button
            onClick={goNext}
            disabled={!hasAnsweredCurrent}
            className={`ml-auto rounded-xl px-6 py-2 text-xs
              ${
                hasAnsweredCurrent
                  ? "bg-sky-500 text-white shadow-[0_0_12px_rgba(56,189,248,0.7)]"
                  : "bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed"
              }`}
          >
            Next ▶
          </button>
        </div>

        {/* Feedback penjelasan */}
        {feedback.msg && (
          <p
            className={`mt-4 whitespace-pre-line text-xs ${
              feedback.state === "correct" ? "text-emerald-300" : "text-red-300"
            }`}
          >
            {feedback.msg}
          </p>
        )}
      </div>
    </div>
  );
}
