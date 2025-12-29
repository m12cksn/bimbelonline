"use client";

import { useState } from "react";

type QuestionStatus = "unanswered" | "correct" | "wrong";

export type AttemptQuestionDetail = {
  questionNumber: number;
  status: QuestionStatus;
  questionText: string;
  selectedAnswer: string | null;
  correctAnswer: string;
  correctAnswerImage?: string | null;
  explanation?: string | null;
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
            "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200";
          if (q.status === "correct") {
            base =
              "bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200";
          } else if (q.status === "wrong") {
            base =
              "bg-rose-100 text-rose-700 border-rose-300 hover:bg-rose-200";
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
            mt-2 rounded-2xl border border-slate-200 bg-white
            px-4 py-3 text-xs md:text-sm text-slate-700 shadow-lg
          "
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="font-semibold">
              Detail soal nomor{" "}
              <span className="text-cyan-300">{active.questionNumber}</span>
            </p>
              <span className="text-[11px] text-slate-500">
                Percobaan {attemptNumber}
              </span>
            </div>

          <p className="text-slate-600 mb-2 line-clamp-3">
            {active.questionText || "Teks soal belum tersedia."}
          </p>

          <div className="space-y-1">
            <p>
              <span className="font-semibold text-slate-500">
                Jawaban kamu:{" "}
              </span>
              <span
                className={
                  active.status === "correct"
                    ? "text-emerald-700 font-semibold"
                    : active.status === "wrong"
                    ? "text-rose-700 font-semibold"
                    : "text-slate-500"
                }
              >
                {active.selectedAnswer ?? "Belum dijawab"}
              </span>
            </p>

            <p>
              <span className="font-semibold text-slate-500">
                Jawaban benar:{" "}
              </span>
              <span className="text-emerald-700 font-semibold">
                {active.correctAnswer}
              </span>
            </p>
            {active.correctAnswerImage && (
              <img
                src={active.correctAnswerImage}
                alt="Jawaban benar"
                className="mt-2 max-h-40 w-full rounded-xl border border-slate-200 bg-white object-contain"
              />
            )}

            {active.explanation ? (
              <p className="text-slate-600">
                <span className="font-semibold text-slate-500">
                  Pembahasan:{" "}
                </span>
                <span className="text-slate-600">{active.explanation}</span>
              </p>
            ) : null}

            <p className="mt-1 text-[11px] text-slate-500">
              Klik bubble lain untuk melihat detail soal yang berbeda.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
