"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export type GradeMaterial = {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  subject_id: number | null;
};

const subjectNames: Record<number, string> = {
  1: "Matematika",
  2: "IPA",
  3: "English",
  4: "Coding",
};

function getVideoEmbedUrl(rawUrl: string) {
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
      } else if (
        parts[0] === "embed" ||
        parts[0] === "shorts" ||
        parts[0] === "live"
      ) {
        videoId = parts[1] ?? null;
      }
    }

    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
    }

    return rawUrl;
  } catch {
    return rawUrl;
  }
}

export default function MaterialCards({
  materials,
}: {
  materials: GradeMaterial[];
}) {
  const [activeMaterial, setActiveMaterial] = useState<GradeMaterial | null>(
    null,
  );

  useEffect(() => {
    if (!activeMaterial) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveMaterial(null);
    };
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [activeMaterial]);

  return (
    <>
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {materials.map((material, index) => (
          <article
            key={material.id}
            className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_18px_55px_-38px_rgba(15,23,42,0.35)] transition hover:-translate-y-1 hover:border-emerald-300"
          >
            <div className="relative aspect-[16/9] overflow-hidden bg-linear-to-br from-emerald-100 via-lime-50 to-white">
              {material.image_url ? (
                <Image
                  src={material.image_url}
                  alt={material.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-cover object-top transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-6xl font-black text-emerald-700/20">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                  Materi {index + 1}
                </span>
                {typeof material.subject_id === "number" && (
                  <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                    {subjectNames[material.subject_id] ?? "Pelajaran"}
                  </span>
                )}
              </div>

              <h2 className="mt-3 line-clamp-2 text-lg font-extrabold text-slate-900">
                {material.title}
              </h2>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">
                {material.description ||
                  "Pelajari materi dan lanjutkan dengan latihan soal yang tersedia."}
              </p>

              <div className="mt-auto grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveMaterial(material)}
                  className="inline-flex items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
                >
                  Lihat Video
                </button>
                <Link
                  href={`/materials/${material.id}?start=practice`}
                  className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500"
                >
                  Latihan Soal
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>

      {activeMaterial && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Video ${activeMaterial.title}`}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setActiveMaterial(null);
          }}
        >
          <div className="w-full max-w-5xl overflow-hidden rounded-lg bg-black shadow-2xl">
            <div className="flex items-center justify-between gap-4 bg-white px-4 py-3">
              <h2 className="line-clamp-1 font-bold text-slate-900">
                {activeMaterial.title}
              </h2>
              <button
                type="button"
                onClick={() => setActiveMaterial(null)}
                className="shrink-0 rounded-md bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200"
                aria-label="Tutup video"
              >
                Tutup
              </button>
            </div>

            {activeMaterial.video_url ? (
              <div className="relative w-full pb-[56.25%]">
                <iframe
                  src={getVideoEmbedUrl(activeMaterial.video_url)}
                  title={`Video ${activeMaterial.title}`}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="flex min-h-72 items-center justify-center bg-amber-50 p-6 text-center text-sm font-semibold text-amber-800">
                Video pembelajaran akan tersedia secepatnya.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
