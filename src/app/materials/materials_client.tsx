"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type MaterialRow = {
  id: number;
  title: string;
  description: string | null;
  image_url?: string | null;
  subject_id?: number | null;
  grade_id?: number | null;
};

type AttemptMap = Record<
  number,
  {
    bestScore: number;
    attemptsCount: number;
  }
>;

const SUBJECTS: Record<number, string> = {
  1: "Matematika",
  2: "IPA",
  3: "English",
  4: "Coding",
};

type Props = {
  materials: MaterialRow[];
  attemptMap: AttemptMap;
  learningTrack: "math" | "coding";
};

export default function MaterialsClient({
  materials,
  attemptMap,
  learningTrack,
}: Props) {
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const gradeOptions = useMemo(() => {
    const grades = new Set<number>();
    materials.forEach((m) => {
      if (typeof m.grade_id === "number") grades.add(m.grade_id);
    });
    return Array.from(grades).sort((a, b) => a - b);
  }, [materials]);

  const subjectOptions = useMemo(() => {
    const subjects = new Set<number>();
    materials.forEach((m) => {
      if (typeof m.subject_id === "number") subjects.add(m.subject_id);
    });
    return Array.from(subjects).sort((a, b) => a - b);
  }, [materials]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return materials.filter((m) => {
      if (keyword) {
        const haystack = `${m.title} ${m.description ?? ""}`.toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }
      if (gradeFilter !== "all") {
        if (Number(gradeFilter) !== (m.grade_id ?? -1)) return false;
      }
      if (subjectFilter !== "all") {
        if (Number(subjectFilter) !== (m.subject_id ?? -1)) return false;
      }
      return true;
    });
  }, [materials, search, gradeFilter, subjectFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, gradeFilter, subjectFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedMaterials = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  return (
    <section>
      <div
        className="
          flex flex-col gap-3 rounded-2xl border border-slate-200
          bg-white px-4 py-4 md:px-5 md:py-4 shadow-sm
        "
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-medium text-slate-900">Jelajahi materi</p>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                🔎
              </span>
              <input
                type="text"
                placeholder="Cari materi (misal: sudut, pecahan)..."
                className="
                  w-full rounded-xl border border-slate-200 bg-white
                  pl-8 pr-3 py-2 text-xs md:text-sm text-slate-900
                  placeholder:text-slate-400
                  focus:outline-none focus:ring-1 focus:ring-emerald-300
                "
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="
                  inline-flex items-center justify-center rounded-xl
                  border border-slate-200 bg-white
                  px-3 py-2 text-xs md:text-sm text-slate-700
                  hover:border-emerald-300 hover:bg-emerald-50
                  transition
                "
              >
                <option value="all">Semua kelas</option>
                {gradeOptions.map((grade) => (
                  <option key={grade} value={grade}>
                    Kelas {grade}
                  </option>
                ))}
              </select>

              {learningTrack !== "coding" && (
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="
                    inline-flex items-center justify-center rounded-xl
                    border border-slate-200 bg-white
                    px-3 py-2 text-xs md:text-sm text-slate-700
                    hover:border-emerald-300 hover:bg-emerald-50
                    transition
                  "
                >
                  <option value="all">Semua mapel</option>
                  {subjectOptions.map((subject) => (
                    <option key={subject} value={subject}>
                      {SUBJECTS[subject] ?? `Mapel ${subject}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          Menampilkan {pagedMaterials.length} dari {filtered.length} materi.
        </p>
      </div>

      {filtered.length > 0 && totalPages > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <span className="text-xs font-semibold text-emerald-700">
            Halaman {currentPage} dari {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-full border border-emerald-600 bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Sebelumnya
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100 disabled:opacity-40"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}

      <div className="mt-4">
        {filtered.length === 0 ? (
          <div
            className="
              rounded-2xl border border-dashed border-slate-200
              bg-white p-6 md:p-8 text-center
              text-slate-600 text-sm
            "
          >
            <p className="font-medium text-slate-900 mb-2">
              Materi tidak ditemukan
            </p>
            <p className="text-xs md:text-sm text-slate-500 max-w-md mx-auto">
              Coba ubah kata kunci atau filter kelas/mapel.
            </p>
          </div>
        ) : (
          <div
            className="
              grid gap-4
              sm:grid-cols-2
              lg:grid-cols-3
            "
          >
            {pagedMaterials.map((m) => {
              const progress = attemptMap[m.id];
              const hasProgress = !!progress;

              return (
                <Link
                  key={m.id}
                  href={`/materials/${m.id}`}
                  className="
                    group flex flex-col overflow-hidden
                    rounded-2xl border border-slate-200
                    bg-white
                    hover:-translate-y-1
                    transition
                    shadow-[0_18px_60px_-45px_rgba(15,23,42,0.2)]
                  "
                >
                  {m.image_url ? (
                    <div className="relative h-56 w-full overflow-hidden bg-slate-50">
                      <Image
                        src={m.image_url}
                        alt={m.title}
                        className="h-full w-full object-cover"
                        width={800}
                        height={600}
                      />
                    </div>
                  ) : (
                    <div className="h-56 w-full bg-linear-to-br from-emerald-200/50 via-slate-100 to-white" />
                  )}

                  <div className="flex flex-1 flex-col gap-3 px-4 py-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-600/80">
                        Materi #{m.id}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {typeof m.grade_id === "number" && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] text-slate-600">
                            Kelas {m.grade_id}
                          </span>
                        )}
                        {typeof m.subject_id === "number" && (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] text-emerald-700">
                            {SUBJECTS[m.subject_id] ?? "Mapel"}
                          </span>
                        )}
                      </div>
                    </div>

                    <h2 className="text-base md:text-lg font-semibold text-emerald-900 line-clamp-2">
                      {m.title}
                    </h2>

                    {m.description && (
                      <p className="text-xs md:text-sm text-slate-500 line-clamp-3">
                        {m.description}
                      </p>
                    )}

                    <div className="mt-auto flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                      <span className="text-[11px] text-slate-500">
                        {hasProgress ? "Lanjutkan latihan" : "Mulai latihan"}
                      </span>

                      <span
                        className={`text-[11px] ${
                          hasProgress ? "text-emerald-700" : "text-slate-500"
                        }`}
                      >
                        {hasProgress
                          ? `Sudah dikerjakan - Skor terbaik: ${Math.round(
                              progress.bestScore
                            )}% - ${progress.attemptsCount}x coba`
                          : "Belum pernah dicoba"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

    </section>
  );
}
