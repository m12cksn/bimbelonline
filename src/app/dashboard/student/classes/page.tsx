// src/app/dashboard/student/classes/page.tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type ClassRow = {
  id: number;
  name: string;
};

export default function StudentClassesPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // palet warna untuk aksen halus di kartu
  const colors = useMemo(
    () => [
      "from-emerald-400 to-teal-500",
      "from-emerald-400 to-teal-500",
      "from-lime-400 to-emerald-500",
      "from-amber-300 to-orange-400",
      "from-teal-400 to-emerald-500",
    ],
    []
  );

  const friendlyIcons = ["📘", "📐", "📊", "🧮", "📚", "🧠", "🪐", "📎"];

  const pickPalette = (idx: number) => colors[idx % colors.length];
  const pickIcon = (idx: number) => friendlyIcons[idx % friendlyIcons.length];

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/student/classes");
      const json = await res.json();

      if (res.ok && json.ok) {
        setClasses(json.classes ?? []);
        setError(null);
      } else {
        setError(json.error ?? "Gagal memuat kelas");
      }
    } catch (err) {
      console.error("load student classes error", err);
      setError("Tidak dapat terhubung ke server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ================= LOADING STATE =================
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-white/80">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-emerald-300/60 bg-white px-5 py-3 shadow-xl">
          <span className="h-3 w-3 animate-ping rounded-full bg-emerald-400" />
          <span className="text-sm font-medium text-emerald-900">
            Memuat daftar kelas...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] space-y-6 md:space-y-8">
      {/* ================= HERO SECTION ================= */}
      <section
        className="
          relative overflow-hidden rounded-3xl
          bg-linear-to-br from-emerald-300 via-green-300 to-emerald-400
          border border-emerald-300/60
          px-5 py-6 md:px-8 md:py-8
          shadow-[0_24px_80px_-45px_rgba(0,0,0,1)]
        "
      >
        {/* subtle glows */}
        <div
          className="pointer-events-none absolute -left-24 top-0 h-48 w-48 rounded-full bg-emerald-300/30 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-24 bottom-0 h-56 w-56 rounded-full bg-teal-300/30 blur-3xl"
          aria-hidden
        />

        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-700">
              Student Classes
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-200">
              Kelas Online yang Kamu Ikuti
            </h1>
            <p className="max-w-xl text-sm md:text-[15px] text-emerald-700 leading-relaxed">
              Pilih kelas untuk melihat jadwal Zoom, materi, dan aktivitas
              belajar. Semua kelas aktif yang terhubung ke akunmu tampil di
              daftar di bawah.
            </p>

            <div className="flex flex-wrap gap-2 text-[11px] md:text-xs">
              <span className="rounded border border-emerald-400/60 bg-emerald-200/60 px-3 py-1 text-emerald-800">
                Live session terjadwal
              </span>
              <span className="rounded border border-emerald-400/60 bg-emerald-200/60 px-3 py-1 text-emerald-800">
                Progres belajar terpantau
              </span>
              <span className="rounded border border-amber-400/60 bg-amber-200/60 px-3 py-1 text-amber-900">
                Materi terstruktur per kelas
              </span>
            </div>
          </div>

          {/* Panel tips */}
          <div
            className="
              mt-2 flex w-full max-w-xs flex-col gap-3
              rounded-2xl border border-emerald-300/60 bg-white/80
              px-4 py-4 text-emerald-900 text-xs md:text-sm
            "
          >
            <p className="font-semibold text-emerald-900">Tips memilih kelas</p>
            <ul className="space-y-1 text-[11px] md:text-xs text-emerald-700">
              <li>• Cocokkan nama kelas dengan info dari admin/guru.</li>
              <li>• Fokus di satu kelas terlebih dahulu sebelum pindah.</li>
              <li>• Catat jadwal Zoom di kalender atau catatanmu.</li>
            </ul>

            <button
              type="button"
              onClick={() => {
                setLoading(true);
                load();
              }}
              className="
                mt-1 inline-flex items-center justify-center gap-2
                rounded bg-emerald-600/80 px-3 py-1.5 text-[11px] md:text-xs
                font-semibold text-white shadow-md shadow-emerald-500/30
                hover:bg-emerald-500 transition
              "
            >
              <span>🔄 Refresh daftar kelas</span>
            </button>
          </div>
        </div>
      </section>

      {/* ================= ERROR / EMPTY STATE ================= */}
      {error && (
        <div
          className="
            flex items-center gap-3 rounded-2xl border border-red-500/40
            bg-linear-to-br from-emerald-300 via-green-300 to-emerald-400 px-4 py-3 text-sm text-red-100 shadow-[0_18px_60px_-45px_rgba(0,0,0,1)]
          "
        >
          <span className="text-lg">⚠️</span>
          <div className="flex flex-1 flex-col">
            <p className="font-semibold">Gagal memuat kelas</p>
            <p className="text-[13px] text-red-100/90">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setLoading(true);
              load();
            }}
            className="
              rounded-xl border border-red-400/60 bg-red-500/40
              px-3 py-1 text-xs font-semibold text-red-50
              hover:bg-red-500/70 transition
            "
          >
            Coba lagi
          </button>
        </div>
      )}

      {!error && classes.length === 0 && (
        <div
          className="
            flex flex-col items-center justify-center gap-3
            rounded-3xl border border-emerald-300/60
            bg-white/80 px-6 py-8 md:px-8 md:py-10
            text-center shadow-[0_18px_60px_-45px_rgba(0,0,0,1)]
          "
        >
          <span className="text-4xl md:text-5xl">📂</span>
          <p className="text-lg md:text-xl font-bold text-emerald-900">
            Belum ada kelas aktif
          </p>
          <p className="max-w-md text-xs md:text-sm text-emerald-700">
            Saat ini kamu belum terdaftar di kelas mana pun. Silakan hubungi
            admin atau tutor untuk dimasukkan ke kelas yang sesuai.
          </p>
          <Link
            href="/dashboard/student"
            className="
              mt-2 inline-flex items-center gap-2 rounded-2xl
              border border-emerald-300/60 bg-white/80
              px-4 py-2 text-xs md:text-sm text-emerald-900
              hover:bg-emerald-500/10 transition
            "
          >
            ⬅️ Kembali ke dashboard
          </Link>
        </div>
      )}

      {/* ================= GRID KELAS (KARTU PREMIUM) ================= */}
      {classes.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
              KELAS AKTIF
            </h2>
            <p className="text-[11px] text-emerald-700">
              Pilih kartu kelas untuk masuk ke halaman detail & jadwal Zoom.
            </p>
          </div>

          <div
            className="
              grid gap-4
              sm:grid-cols-2
              lg:grid-cols-3
            "
          >
            {classes.map((c, index) => (
              <Link
                key={c.id}
                href={`/dashboard/student/classes/${c.id}/zoom`}
                className="
                  group relative flex flex-col overflow-hidden
                  rounded-3xl border border-emerald-300/60 bg-white/90
                  shadow-[0_22px_70px_-40px_rgba(0,0,0,1)]
                  transition-transform 
                  hover:-translate-y-1.5 hover:border-emerald-400/70 hover:shadow-[0_26px_80px_-38px_rgba(16,185,129,0.55)]
                "
              >
                {/* top accent bar */}
                <div
                  className={`
                    h-1 w-full bg-gradient-to-r ${pickPalette(index)}
                  `}
                />

                <article className="flex flex-1 flex-col px-4 py-4 md:px-5 md:py-5 gap-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Icon dalam ring gradient */}
                      <div
                        className={`
                          rounded-2xl p-[1px] bg-gradient-to-tr ${pickPalette(
                            index
                          )}
                        `}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-xl text-emerald-900">
                          {pickIcon(index)}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                          Zoom Class
                        </p>
                        <h3 className="text-base md:text-lg font-semibold text-emerald-900 leading-snug line-clamp-2">
                          {c.name}
                        </h3>
                        <p className="text-[11px] md:text-xs text-emerald-700">
                          Terhubung ke akunmu. Di dalamnya ada jadwal Zoom,
                          materi, dan progres latihan.
                        </p>
                      </div>
                    </div>

                    {/* Badge kecil di kanan */}
                    <span
                      className="
                        inline-flex items-center rounded-full border border-emerald-500/50
                        bg-emerald-200/60 px-2.5 py-1 text-[10px] font-medium
                        text-emerald-700
                      "
                    >
                      Aktif
                    </span>
                  </div>

                  {/* Info singkat */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] md:text-xs text-emerald-700">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Siap untuk sesi Zoom berikutnya
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1">
                      🧮 Kelas matematika terstruktur
                    </span>
                  </div>

                  {/* Footer CTA */}
                  <div className="mt-1 flex items-center justify-between border-t border-emerald-200 pt-3 text-[11px] md:text-xs">
                    <span className="text-emerald-700">
                      Klik untuk membuka halaman kelas.
                    </span>
                    <span
                      className="
                        inline-flex items-center gap-1.5 rounded
                        bg-emerald-600 px-3 py-1.5 font-semibold text-white
                        group-hover:bg-emerald-500 group-hover:text-white
                        transition-colors
                      "
                    >
                      Buka kelas
                      <span
                        aria-hidden
                        className="transition-transform group-hover:translate-x-0.5"
                      >
                        ➜
                      </span>
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
