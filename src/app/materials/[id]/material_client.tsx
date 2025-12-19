// app/materials/[id]/material_client.tsx
"use client";

import React, { useState } from "react";
import MaterialQuiz from "./quiz_client";
import MaterialLeaderboard from "./leaderboard_client";

type Question = {
  id: number;
  question_number: number;
  text: string;
  options: string[] | null;
};

type MaterialData = {
  id: number;
  title: string;
  description: string | null;
  video_url: string | null;
  pdf_url: string | null;
};

interface Props {
  material: MaterialData;
  questions: Question[];
  initialLastNumber: number;
  userId: string;
  isPremium: boolean; // ✅
}

export default function MaterialWithResources({
  material,
  questions,
  initialLastNumber,
  userId,
  isPremium,
}: Props) {
  const [showQuiz, setShowQuiz] = useState(false);

  const isYouTube =
    material.video_url &&
    (material.video_url.includes("youtube.com") ||
      material.video_url.includes("youtu.be"));

  return (
    <div className="text-slate-50">
      <h1 className="text-2xl font-extrabold text-white">{material.title}</h1>
      {material.description && (
        <p className="mt-1 text-xs text-slate-300">{material.description}</p>
      )}

      <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[11px]">
        <span className="text-slate-400">Status akun:</span>
        {isPremium ? (
          <span className="font-semibold text-amber-300">
            Premium ⭐ Full akses soal
          </span>
        ) : (
          <span className="font-semibold text-emerald-300">
            Gratis 🎁 (soal 1–{8} saja)
          </span>
        )}
      </div>

      {/* Bagian video & PDF */}
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {/* Video */}
        <div className="md:col-span-2 rounded-2xl border border-slate-700 bg-slate-900/80 p-3 shadow-md shadow-black/40">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-cyan-300">
              🎥 Video penjelasan
            </span>
            {material.video_url && (
              <a
                href={material.video_url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-slate-300 underline hover:text-cyan-200"
              >
                Buka di tab baru ↗
              </a>
            )}
          </div>
          {material.video_url ? (
            isYouTube ? (
              <div className="relative w-full overflow-hidden rounded-xl border border-slate-700 bg-black pb-[56.25%]">
                <iframe
                  src={material.video_url.replace("watch?v=", "embed/")}
                  className="absolute left-0 top-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <p className="text-[11px] text-slate-300">
                Video tersedia di link di atas.
              </p>
            )
          ) : (
            <p className="text-[11px] text-slate-400">
              Belum ada video penjelasan untuk materi ini.
            </p>
          )}
        </div>

        {/* PDF */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-3 shadow-md shadow-black/40 text-xs">
          <div className="mb-2 font-semibold text-emerald-300">
            📄 Materi PDF
          </div>
          {material.pdf_url ? (
            <>
              <p className="text-slate-300 mb-2">
                Kamu bisa baca materi dalam bentuk PDF sebelum mengerjakan soal.
              </p>
              <a
                href={material.pdf_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-xl border border-emerald-400/60 bg-emerald-500/20 px-3 py-2 text-[11px] font-semibold text-emerald-100 hover:bg-emerald-500/40"
              >
                Buka PDF 📚
              </a>
            </>
          ) : (
            <p className="text-slate-400">
              Belum ada file PDF untuk materi ini.
            </p>
          )}
        </div>
      </div>

      {/* Tombol mulai kerjakan soal */}
      <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-xs">
        <div>
          <div className="font-semibold text-slate-100">
            Siap latihan soal? ✏️
          </div>
          <div className="text-[11px] text-slate-400">
            Tonton video dan baca PDF dulu, lalu klik tombol di samping untuk
            mulai mengerjakan.
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowQuiz(true)}
          className="rounded-xl border border-cyan-400/70 bg-cyan-500/30 px-3 py-2 text-[11px] font-semibold text-cyan-50 shadow-md shadow-cyan-500/40 transition hover:-translate-y-px hover:bg-cyan-500/50"
        >
          {showQuiz ? "Lanjut kerjakan soal ➜" : "Mulai kerjakan soal ➜"}
        </button>
      </div>

      {/* Quiz hanya muncul setelah tombol diklik */}
      {showQuiz && (
        <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
          <MaterialQuiz
            materialId={material.id}
            questions={questions}
            initialLastNumber={initialLastNumber}
            isPremium={isPremium}
          />
          <MaterialLeaderboard
            materialId={material.id}
            currentUserId={userId}
          />
        </div>
      )}
    </div>
  );
}
