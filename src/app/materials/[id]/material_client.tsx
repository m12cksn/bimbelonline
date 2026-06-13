// app/materials/[id]/material_client.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import MaterialQuiz from "./quiz_client";
import MaterialLeaderboard from "./leaderboard_client";
import BatchPracticeQuiz from "./batch_practice_quiz";

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
  simpleView?: boolean;
  autoStartPractice?: boolean;
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
  isAdmin = false,
  isGuest = false,
  isEmbed = false,
  embedUrl = null,
  simpleView = false,
  autoStartPractice = false,
}: Props) {
  const embedMaterial = isEmbed;
  const [mode, setMode] = useState<"practice" | "tryout" | null>(
    embedMaterial || autoStartPractice ? "practice" : null
  );
  const [showVideo, setShowVideo] = useState(Boolean(material.video_url));
  const quizRef = useRef<HTMLDivElement | null>(null);
  const startRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (embedMaterial) return;
    if (!mode || !quizRef.current) return;
    quizRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [embedMaterial, mode]);

  useEffect(() => {
    if (embedMaterial) return;
    if (autoStartPractice) return;
    if (!startRef.current) return;
    const handle = window.setTimeout(() => {
      startRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => window.clearTimeout(handle);
  }, [autoStartPractice, embedMaterial]);

  const handleStart = (nextMode: "practice" | "tryout") => {
    setMode(nextMode);
  };

  const getYouTubeEmbedUrl = (rawUrl: string | null): string | null => {
    if (!rawUrl) return null;
    try {
      const url = new URL(rawUrl);
      const host = url.hostname.toLowerCase();
      let videoId: string | null = null;

      if (host.includes("youtu.be")) {
        videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
      } else if (host.includes("youtube.com")) {
        const parts = url.pathname.split("/").filter(Boolean);
        if (url.pathname === "/watch") {
          videoId = url.searchParams.get("v");
        } else if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") {
          videoId = parts[1] ?? null;
        }
      }

      if (!videoId) return null;
      return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
    } catch {
      return null;
    }
  };

  const youTubeEmbedUrl = getYouTubeEmbedUrl(material.video_url);
  const isYouTube = Boolean(youTubeEmbedUrl);
  const getResourceHref = (rawUrl: string | null): string | null => {
    if (!rawUrl) return null;
    try {
      const parsed = new URL(rawUrl);
      const isMarkdown = parsed.pathname.toLowerCase().endsWith(".md");
      if (isMarkdown) {
        return `/materials/${material.id}/summary`;
      }
      return rawUrl;
    } catch {
      return rawUrl;
    }
  };
  const resourceHref = getResourceHref(material.pdf_url);

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
      {!embedMaterial && !simpleView && (
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
                Akses penuh
              </span>
            ) : isGuest ? (
              <span className="font-semibold text-emerald-700">
                Akses penuh tanpa login
              </span>
            ) : (
              <span className="font-semibold text-emerald-700">
                Akses penuh
              </span>
            )}
            <span className="text-slate-400">-</span>
            <span className="text-slate-600">
              Latihan: {practiceQuestions.length} soal
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

      {/* Video pembelajaran menjadi fokus utama saat halaman dibuka */}
      {!embedMaterial && simpleView && (
        <div ref={startRef} className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            {material.video_url ? (
              isYouTube ? (
                <div className="relative w-full bg-black pb-[56.25%]">
                  <iframe
                    src={youTubeEmbedUrl ?? undefined}
                    title={`Video ${material.title}`}
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="flex min-h-64 items-center justify-center p-6">
                  <a
                    href={material.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-500"
                  >
                    Buka Video Pembelajaran
                  </a>
                </div>
              )
            ) : (
              <div className="flex min-h-64 items-center justify-center bg-amber-50 p-6 text-center text-sm font-semibold text-amber-800">
                Video pembelajaran akan tersedia secepatnya.
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleStart("practice")}
            className="w-full rounded-lg bg-emerald-600 px-6 py-4 text-base font-bold text-white shadow-md transition hover:bg-emerald-500"
          >
            {mode === "practice"
              ? "Lanjutkan Latihan Soal"
              : "Mulai Latihan Soal"}
          </button>
        </div>
      )}

      {!embedMaterial && !simpleView && (
        <div ref={startRef} className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-3 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.35)] sm:p-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-bold text-emerald-700">
                  Video pembelajaran
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Tonton penjelasan ini dulu, lalu lanjutkan latihan soal.
                </p>
              </div>
              {material.video_url && (
                <button
                  type="button"
                  onClick={() => setShowVideo((prev) => !prev)}
                  className="inline-flex w-fit items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                >
                  {showVideo ? "Sembunyikan video" : "Tampilkan video"}
                </button>
              )}
            </div>

            {material.video_url ? (
              <>
                {showVideo && (
                  <div className="mt-3">
                    {isYouTube ? (
                      <>
                        <div className="relative w-full overflow-hidden rounded-[1.35rem] border border-slate-200 bg-black pb-[56.25%] shadow-inner">
                          <iframe
                            src={youTubeEmbedUrl ?? undefined}
                            className="absolute left-0 top-0 h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                          />
                        </div>
                        <a
                          href={material.video_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block text-[11px] text-slate-600 underline hover:text-emerald-700"
                        >
                          Jika video tidak tampil, buka di YouTube ↗
                        </a>
                      </>
                    ) : (
                      <div className="rounded-[1.35rem] border border-emerald-100 bg-emerald-50 p-6 text-center">
                        <p className="text-sm font-semibold text-emerald-800">
                          Video pembelajaran tersedia di link eksternal.
                        </p>
                        <a
                          href={material.video_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center justify-center rounded-xl border border-emerald-400/60 bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600"
                        >
                          Buka video di tab baru
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800">
                <p className="font-semibold">⏳ Video akan tersedia secepatnya.</p>
                <p className="mt-1">
                  Sekarang kamu bisa latihan untuk menyelesaikan soal dulu.
                  Terima kasih 🙌
                </p>
              </div>
            )}
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 text-xs shadow-sm">
            <div className="font-semibold text-slate-700">Setelah menonton</div>
            <p className="mt-1 text-slate-500">
              Jika sudah paham, lanjutkan ke latihan soal. Materi PDF tersedia
              sebagai bahan baca tambahan.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => handleStart("practice")}
                className="relative w-full overflow-hidden rounded-2xl border border-emerald-300 bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_-18px_rgba(16,185,129,0.8)] transition hover:-translate-y-0.5 hover:bg-emerald-600"
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
                  className="relative w-full overflow-hidden rounded-2xl border border-amber-300 bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_-18px_rgba(245,158,11,0.7)] transition hover:-translate-y-0.5 hover:bg-amber-600"
                >
                  <span className="relative z-10">
                    {mode === "tryout" ? "Lanjut tryout" : "Mulai tryout"}
                  </span>
                  <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
                </button>
              )}
            </div>

            <div className="mb-2 font-semibold text-emerald-700">
              📄 Materi PDF
            </div>
            {material.pdf_url ? (
              <>
                <p className="text-slate-600 mb-2">
                  Kamu bisa baca materi dalam bentuk PDF sebelum mengerjakan
                  soal.
                </p>
                <a
                  href={resourceHref ?? material.pdf_url ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-xl border border-emerald-400/60 bg-emerald-500 px-3 py-2 text-[11px] font-semibold text-white hover:bg-emerald-600"
                >
                  {resourceHref?.includes("/summary")
                    ? "Baca Ringkasan ↗"
                    : "Buka Materi ↗"}
                </a>
              </>
            ) : (
              <p className="text-slate-500">
                Belum ada file PDF untuk materi ini.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Quiz hanya muncul setelah tombol diklik */}
      {mode && (
        <div ref={quizRef} className={embedMaterial ? "mt-2" : "mt-5 space-y-4"}>
          {embedMaterial && embedUrl ? (
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-2 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.2)] sm:p-3 md:p-4">
              <div className="relative h-[68vh] min-h-[360px] w-full overflow-hidden rounded-[1.35rem] border border-slate-200 bg-slate-50 sm:min-h-[440px] lg:h-[76vh] lg:min-h-[620px] lg:max-h-[780px]">
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
              {mode === "practice" ? (
                <BatchPracticeQuiz
                  materialId={material.id}
                  questionMeta={visiblePracticeQuestions}
                  isAdmin={isAdmin}
                  isGuest={isGuest}
                />
              ) : (
                <MaterialQuiz
                  materialId={material.id}
                  questionMeta={tryoutQuestions}
                  initialLastNumber={initialLastNumber}
                  userId={userId}
                  isPremium={isPremium}
                  questionLimit={questionLimit}
                  planLabel={planLabel}
                  planPriceLabel={planPriceLabel}
                  upgradeOptions={[]}
                  isAdmin={isAdmin}
                  isGuest={isGuest}
                  isTryout
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
                    (material.tryout_duration_minutes ??
                      tryoutQuestions.length) * 60
                  }
                />
              )}
              {!embedMaterial && !isGuest && !simpleView && (
                <MaterialLeaderboard
                  materialId={material.id}
                  currentUserId={userId}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* Ringkasan materi + contoh soal */}
      {!embedMaterial && !simpleView && (
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
