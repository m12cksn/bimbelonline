// app/materials/[id]/material_client.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import MaterialQuiz from "./quiz_client";
import MaterialLeaderboard from "./leaderboard_client";

type QuestionOptionRow = {
  label: string;
  value: string;
  image_url?: string | null;
  is_correct?: boolean | null;
  sort_order?: number | null;
};

type DropTargetRow = {
  id: string;
  label: string;
  placeholder?: string | null;
  sort_order?: number | null;
};

type DropItemRow = {
  id: string;
  label: string;
  image_url?: string | null;
  correct_target_id: string;
  sort_order?: number | null;
};

type QuestionItemRow = {
  id: string;
  label: string;
  prompt: string;
  image_url?: string | null;
  sort_order?: number | null;
};

type Question = {
  id: string;
  question_number: number;
  type: "mcq" | "essay" | "multipart" | "drag_drop";
  prompt: string;
  helper_text?: string | null;
  question_image_url?: string | null;
  question_mode?: "practice" | "tryout" | null;
  options: QuestionOptionRow[];
  drop_targets: DropTargetRow[];
  drop_items: DropItemRow[];
  items: QuestionItemRow[];
};

type QuestionMeta = {
  id: string;
  question_number: number;
  type: "mcq" | "essay" | "multipart" | "drag_drop";
  question_mode?: "practice" | "tryout" | null;
};

type MaterialData = {
  id: number;
  title: string;
  description: string | null;
  video_url: string | null;
  pdf_url: string | null;
  tryout_duration_minutes?: number | null;
};

interface Props {
  material: MaterialData;
  questionMeta: QuestionMeta[];
  exampleQuestions: Array<{ id: string; prompt: string; imageUrl: string | null }>;
  initialLastNumber: number;
  userId: string;
  isPremium: boolean;
  questionLimit: number;
  planLabel: string;
  planPriceLabel: string;
  upgradeOptions: Array<{ label: string; priceLabel: string }>;
  isAdmin?: boolean;
  isGuest?: boolean;
  isEmbed?: boolean;
  embedUrl?: string | null;
}

export default function MaterialWithResources({
  material,
  questionMeta,
  exampleQuestions,
  initialLastNumber,
  userId,
  isPremium,
  questionLimit,
  planLabel,
  planPriceLabel,
  upgradeOptions,
  isAdmin = false,
  isGuest = false,
  isEmbed = false,
  embedUrl = null,
}: Props) {
  const embedMaterial = isEmbed || Boolean(embedUrl);
  const [mode, setMode] = useState<"practice" | "tryout" | null>(
    embedMaterial ? "practice" : null
  );
  const [showVideo, setShowVideo] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const quizRef = useRef<HTMLDivElement | null>(null);
  const startRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (embedMaterial) return;
    if (!mode || !quizRef.current) return;
    quizRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [embedMaterial, mode]);

  useEffect(() => {
    if (embedMaterial) return;
    if (!startRef.current) return;
    const handle = window.setTimeout(() => {
      startRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => window.clearTimeout(handle);
  }, [embedMaterial]);

  const handleStart = (nextMode: "practice" | "tryout") => {
    setMode(nextMode);
  };

  const isYouTube =
    material.video_url &&
    (material.video_url.includes("youtube.com") ||
      material.video_url.includes("youtu.be"));

  const practiceQuestions = questionMeta.filter(
    (q) => q.question_mode !== "tryout"
  );
  const tryoutQuestions = isGuest
    ? []
    : questionMeta.filter((q) => q.question_mode === "tryout");
  const visiblePracticeQuestions = isGuest
    ? practiceQuestions.filter((q) => q.question_number <= questionLimit)
    : practiceQuestions;

  return (
    <div className="text-slate-900">
      {!embedMaterial && (
        <>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {material.title}
          </h1>
          {material.description && (
            <p className="mt-1 text-xs text-slate-600">{material.description}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px]">
            <span className="text-slate-500">Status akun:</span>
            {isAdmin ? (
              <span className="font-semibold text-emerald-700">
                Admin - Akses semua soal
              </span>
            ) : isPremium ? (
              <span className="font-semibold text-amber-700">
                {planLabel} Akses soal 1-{questionLimit}
              </span>
            ) : isGuest ? (
              <span className="font-semibold text-emerald-700">
                Gratis (tanpa login) - {questionLimit} soal
              </span>
            ) : (
              <span className="font-semibold text-emerald-700">
                Gratis (soal 1-{questionLimit} saja)
              </span>
            )}
            <span className="text-slate-400">-</span>
            <span className="text-slate-600">
              Latihan: {practiceQuestions.length} soal
              {isGuest ? ` (${questionLimit} gratis)` : ""}
            </span>
            {!isGuest && (
              <>
                <span className="text-slate-400">-</span>
                <span className="text-slate-600">
                  Tryout: {tryoutQuestions.length} soal
                </span>
              </>
            )}
          </div>
        </>
      )}

      {/* Tombol mulai kerjakan soal */}
      {!embedMaterial && (
        <div
          ref={startRef}
          className="mt-5 rounded-3xl border border-emerald-200/70 bg-white px-5 py-4 shadow-[0_24px_70px_-40px_rgba(16,185,129,0.45)]"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-700">
                Siap latihan soal?
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Tonton video atau baca PDF dulu, lalu tekan tombol besar di
                kanan untuk mulai mengerjakan.
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleStart("practice")}
                className="relative overflow-hidden rounded-2xl border border-emerald-300 bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_-18px_rgba(16,185,129,0.8)] transition hover:-translate-y-0.5 hover:bg-emerald-600"
              >
                <span className="relative z-10">
                  {mode === "practice" ? "Lanjut latihan" : "Mulai latihan"}
                </span>
                <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
              </button>
              {!isGuest && tryoutQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleStart("tryout")}
                  className="relative overflow-hidden rounded-2xl border border-amber-300 bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_-18px_rgba(245,158,11,0.7)] transition hover:-translate-y-0.5 hover:bg-amber-600"
                >
                  <span className="relative z-10">
                    {mode === "tryout" ? "Lanjut tryout" : "Mulai tryout"}
                  </span>
                  <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quiz hanya muncul setelah tombol diklik */}
      {mode && (
        <div ref={quizRef} className={embedMaterial ? "mt-2" : "mt-4 space-y-4"}>
          {embedMaterial && embedUrl ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.2)]">
              <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 pb-[62%]">
                <iframe
                  src={embedUrl}
                  title="Latihan interaktif"
                  className="absolute left-0 top-0 h-full w-full"
                  allow="fullscreen"
                />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Latihan interaktif ini bisa kamu kerjakan langsung di sini.
              </p>
            </div>
          ) : (
            <>
              <MaterialQuiz
                materialId={material.id}
                questionMeta={
                  mode === "tryout" ? tryoutQuestions : visiblePracticeQuestions
                }
                initialLastNumber={initialLastNumber}
                userId={userId}
                isPremium={isPremium}
                questionLimit={questionLimit}
                planLabel={planLabel}
                planPriceLabel={planPriceLabel}
                upgradeOptions={upgradeOptions}
                isAdmin={isAdmin}
                isGuest={isGuest}
                isTryout={mode === "tryout"}
                onReady={
                  embedMaterial
                    ? undefined
                    : () => {
                        quizRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }
                }
                timerSeconds={
                  mode === "tryout"
                    ? (material.tryout_duration_minutes ??
                        tryoutQuestions.length) * 60
                    : undefined
                }
              />
              {!embedMaterial && !isGuest && (
                <MaterialLeaderboard
                  materialId={material.id}
                  currentUserId={userId}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* Bagian video & PDF */}
      {!embedMaterial && (
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {/* Video */}
          <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-700">
                🎥 Video penjelasan
              </span>
            </div>
            {material.video_url ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowVideo((prev) => !prev)}
                  className="inline-flex items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                >
                  {showVideo ? "Tutup video" : "Buka video penjelasan"}
                </button>
                {showVideo && (
                  <div className="mt-3">
                    {isYouTube ? (
                      <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-black pb-[56.25%]">
                        <iframe
                          src={material.video_url.replace("watch?v=", "embed/")}
                          className="absolute left-0 top-0 h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <a
                        href={material.video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-slate-600 underline hover:text-emerald-700"
                      >
                        Buka video di tab baru ↗
                      </a>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="text-[11px] text-slate-500">
                Belum ada video penjelasan untuk materi ini.
              </p>
            )}
          </div>

          {/* PDF */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm text-xs">
            <div className="mb-2 font-semibold text-emerald-700">
              📄 Materi PDF
            </div>
            {material.pdf_url ? (
              <>
                <p className="text-slate-600 mb-2">
                  Kamu bisa baca materi dalam bentuk PDF sebelum mengerjakan
                  soal.
                </p>
                <button
                  type="button"
                  onClick={() => setShowPdf((prev) => !prev)}
                  className="inline-flex items-center justify-center rounded-xl border border-emerald-400/60 bg-emerald-500 px-3 py-2 text-[11px] font-semibold text-white hover:bg-emerald-600"
                >
                  {showPdf ? "Tutup PDF" : "Buka PDF 📚"}
                </button>
                {showPdf && (
                  <div className="mt-3">
                    <iframe
                      src={material.pdf_url}
                      title="Materi PDF"
                      className="h-64 w-full rounded-xl border border-slate-200"
                    />
                  </div>
                )}
              </>
            ) : (
              <p className="text-slate-500">
                Belum ada file PDF untuk materi ini.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Ringkasan materi + contoh soal */}
      {!embedMaterial && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700 shadow-sm">
            <div className="mb-2 font-semibold text-emerald-700">
              Ringkasan materi
            </div>
            {material.description ? (
              <p className="text-slate-600 leading-relaxed">
                {material.description}
              </p>
            ) : (
              <p className="text-slate-500">
                Ringkasan materi belum tersedia. Kamu bisa mulai latihan atau
                tonton video terlebih dahulu.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700 shadow-sm">
            <div className="mb-2 font-semibold text-emerald-700">
              Contoh soal
            </div>
            {exampleQuestions.length === 0 ? (
              <p className="text-slate-500">Belum ada contoh soal.</p>
            ) : (
              <div className="space-y-3">
                {exampleQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <p className="text-[11px] text-slate-500">
                      Contoh {idx + 1}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {q.prompt}
                    </p>
                    {q.imageUrl && (
                      <img
                        src={q.imageUrl}
                        alt={`Contoh soal ${idx + 1}`}
                        className="mt-2 max-h-32 w-full rounded-xl border border-slate-200 object-contain"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
