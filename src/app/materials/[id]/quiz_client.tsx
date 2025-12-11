"use client";

import { useState } from "react";
import Link from "next/link";

type Question = {
  id: number;
  question_number: number;
  text: string;
  options: string[] | null;
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

  // ⬇️ statistik sesi untuk review akhir
  const [sessionStats, setSessionStats] = useState<{
    totalAnswered: number;
    correct: number;
  }>({ totalAnswered: 0, correct: 0 });

  const totalQuestions = questions.length;

  const currentQuestion = questions.find(
    (q) => q.question_number === currentNumber
  );

  // ✅ Kalau sudah tidak ada soal lagi → tampilkan halaman review
  if (!currentQuestion) {
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
            className="h-full rounded-full bg-Linear-to-r from-emerald-400 via-cyan-400 to-purple-400"
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
    !isPremium && currentQuestion.question_number > FREE_LIMIT;

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
      <div className="mb-3 flex items-center justify-between text-xs text-slate-300">
        <div>
          Soal{" "}
          <span className="font-semibold text-cyan-300">
            {currentQuestion.question_number}
          </span>{" "}
          dari{" "}
          <span className="font-semibold text-cyan-300">
            {questions.length}
          </span>
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

      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl shadow-black/40">
        {/* dekorasi */}
        <div className="pointer-events-none absolute -top-6 -right-6 h-20 w-20 rounded-full bg-Linear-to-tr from-cyan-500/30 via-purple-500/30 to-pink-500/30 blur-xl" />

        <p className="relative z-10 mb-4 text-sm text-slate-50">
          {currentQuestion.text}
        </p>

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
          <div className="relative z-10 space-y-2">
            {(currentQuestion.options || []).map((opt, i) => (
              <button
                key={i}
                disabled={loading}
                onClick={() => handleAnswer(opt)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-left text-sm text-slate-50 transition hover:-translate-y-px hover:border-cyan-400 hover:bg-slate-750 hover:shadow-md hover:shadow-cyan-500/30 disabled:opacity-60"
              >
                {opt}
              </button>
            ))}
          </div>
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
  );
}
