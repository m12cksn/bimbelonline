"use client";

import { useState } from "react";

type QuestionStatus = "unanswered" | "correct" | "wrong";

export type AttemptQuestionDetail = {
  questionNumber: number;
  status: QuestionStatus;
  questionText: string;
  selectedAnswer: string | null;
  correctAnswer: string;
};

interface AttemptPerQuestionDetailsProps {
  attemptNumber: 1 | 2;
  details: AttemptQuestionDetail[];
}

export default function AttemptPerQuestionDetails({
  attemptNumber,
  details,
}: AttemptPerQuestionDetailsProps) {
  const [activeNumber, setActiveNumber] = useState<number | null>(null);

  const active = activeNumber
    ? details.find((d) => d.questionNumber === activeNumber) ?? null
    : null;

  const handleClick = (num: number) => {
    setActiveNumber((prev) => (prev === num ? null : num));
  };

  return (
    <div className="space-y-4">
      {/* Bubbles */}
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
        {details.map((q) => {
          let base =
            "bg-slate-700/60 text-slate-100 border-slate-600 hover:bg-slate-600";
          if (q.status === "correct") {
            base =
              "bg-emerald-500/25 text-emerald-100 border-emerald-400/70 hover:bg-emerald-500/40";
          } else if (q.status === "wrong") {
            base =
              "bg-rose-500/25 text-rose-100 border-rose-400/70 hover:bg-rose-500/40";
          }

          const isActive = activeNumber === q.questionNumber;

          return (
            <button
              key={q.questionNumber}
              type="button"
              onClick={() => handleClick(q.questionNumber)}
              className={`
                flex h-9 w-9 items-center justify-center rounded-full border
                text-xs font-semibold transition
                focus:outline-none focus:ring-2 focus:ring-cyan-400/80
                ${base}
                ${
                  isActive
                    ? "ring-2 ring-cyan-300 shadow-lg shadow-cyan-500/30"
                    : ""
                }
              `}
            >
              {q.questionNumber}
            </button>
          );
        })}
      </div>

      {/* Popover detail soal */}
      {active && (
        <div
          className="
            mt-2 rounded-2xl border border-slate-700 bg-slate-900/90
            px-4 py-3 text-xs md:text-sm text-slate-100 shadow-lg
          "
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="font-semibold">
              Detail soal nomor{" "}
              <span className="text-cyan-300">{active.questionNumber}</span>
            </p>
            <span className="text-[11px] text-slate-400">
              Percobaan {attemptNumber}
            </span>
          </div>

          <p className="text-slate-200 mb-2 line-clamp-3">
            {active.questionText || "Teks soal belum tersedia."}
          </p>

          <div className="space-y-1">
            <p>
              <span className="font-semibold text-slate-300">
                Jawaban kamu:{" "}
              </span>
              <span
                className={
                  active.status === "correct"
                    ? "text-emerald-300 font-semibold"
                    : active.status === "wrong"
                    ? "text-rose-300 font-semibold"
                    : "text-slate-300"
                }
              >
                {active.selectedAnswer ?? "Belum dijawab"}
              </span>
            </p>

            <p>
              <span className="font-semibold text-slate-300">
                Jawaban benar:{" "}
              </span>
              <span className="text-cyan-200 font-semibold">
                {active.correctAnswer}
              </span>
            </p>

            <p className="mt-1 text-[11px] text-slate-400">
              Klik bubble lain untuk melihat detail soal yang berbeda.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
