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

  const colors = useMemo(
    () => [
      "from-amber-300 to-orange-400",
      "from-sky-300 to-blue-400",
      "from-pink-300 to-rose-400",
      "from-emerald-300 to-teal-400",
      "from-indigo-300 to-purple-400",
    ],
    []
  );

  const friendlyIcons = ["🎈", "📚", "🚀", "🧩", "🎵", "🌈", "🪐", "🧠"];

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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 px-5 py-3 shadow-[0_18px_60px_-45px_rgba(0,0,0,1)]">
          <span className="h-3 w-3 animate-ping rounded-full bg-cyan-400" />
          <span className="text-sm font-medium text-cyan-100">
            Membuka daftar kelas ceria untukmu...
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
          bg-gradient-to-br from-sky-900/60 via-slate-900/70 to-indigo-950/80
          border border-slate-800/80
          px-5 py-6 md:px-8 md:py-8
          shadow-[0_20px_80px_-40px_rgba(0,0,0,1)]
        "
      >
        {/* Glows */}
        <div
          className="pointer-events-none absolute -left-10 top-0 h-40 w-40 rounded-full bg-cyan-500/30 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 bottom-0 h-44 w-44 rounded-full bg-violet-500/25 blur-3xl"
          aria-hidden
        />

        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-300/80">
              Zoom Classes
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Kelas Zoom Ceria Kamu 🎥
            </h1>
            <p className="max-w-xl text-sm md:text-[15px] text-slate-200/90 leading-relaxed">
              Di sini kamu bisa masuk ke kelas Zoom sesuai jadwal. Tinggal klik
              kelas yang aktif, siapkan buku, pensil, dan semangat belajar.
            </p>

            <div className="flex flex-wrap gap-2 text-[11px] md:text-xs">
              <span className="rounded-full border border-cyan-400/60 bg-cyan-500/15 px-3 py-1 text-cyan-100">
                🎧 Belajar live dengan tutor
              </span>
              <span className="rounded-full border border-emerald-400/60 bg-emerald-500/15 px-3 py-1 text-emerald-100">
                👋 Bisa tanya langsung
              </span>
              <span className="rounded-full border border-amber-400/60 bg-amber-500/15 px-3 py-1 text-amber-50">
                🧠 Latihan bareng teman
              </span>
            </div>
          </div>

          {/* Panel kecil di kanan */}
          <div
            className="
              mt-2 flex w-full max-w-xs flex-col gap-3
              rounded-2xl border border-slate-700/80 bg-slate-950/70
              px-4 py-4 text-slate-100 text-xs md:text-sm
            "
          >
            <p className="font-semibold text-cyan-100">Tips ikut kelas Zoom:</p>
            <ul className="space-y-1 text-[11px] md:text-xs text-slate-300">
              <li>• Masuk kelas 5–10 menit sebelum mulai.</li>
              <li>• Siapkan buku, pensil, dan catatan.</li>
              <li>• Matikan suara jika tidak berbicara (mute).</li>
              <li>• Kalau bingung, boleh langsung tanya guru. 😊</li>
            </ul>

            <button
              type="button"
              onClick={() => {
                setLoading(true);
                load();
              }}
              className="
                mt-1 inline-flex items-center justify-center gap-2
                rounded-xl bg-cyan-600/70 px-3 py-1.5 text-[11px] md:text-xs
                font-semibold text-white shadow-md shadow-cyan-500/20
                hover:bg-cyan-500 transition
              "
            >
              <span>🔄 Segarkan daftar kelas</span>
            </button>
          </div>
        </div>
      </section>

      {/* ================= ERROR / EMPTY STATE ================= */}
      {error && (
        <div
          className="
            flex items-center gap-3 rounded-2xl border border-red-500/40
            bg-red-950/40 px-4 py-3 text-sm text-red-100 shadow-[0_12px_40px_-30px_rgba(0,0,0,1)]
          "
        >
          <span className="text-lg">😿</span>
          <div className="flex flex-1 flex-col">
            <p className="font-semibold">Ups, ada kendala memuat kelas</p>
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
            rounded-3xl border border-slate-800
            bg-slate-950/70 px-6 py-8 md:px-8 md:py-10
            text-center shadow-[0_18px_60px_-45px_rgba(0,0,0,1)]
          "
        >
          <span className="text-4xl md:text-5xl animate-bounce">🌈</span>
          <p className="text-lg md:text-xl font-bold text-slate-50">
            Belum ada kelas aktif
          </p>
          <p className="max-w-md text-xs md:text-sm text-slate-400">
            Admin atau guru belum memasukkan kamu ke kelas Zoom. Kamu bisa tanya
            ke guru atau admin bimbel untuk dijadwalkan kelas baru.
          </p>
          <Link
            href="/dashboard/student"
            className="
              mt-2 inline-flex items-center gap-2 rounded-2xl
              border border-slate-700 bg-slate-900/80
              px-4 py-2 text-xs md:text-sm text-slate-100
              hover:bg-slate-800 transition
            "
          >
            ⬅️ Kembali ke dashboard
          </Link>
        </div>
      )}

      {/* ================= GRID KELAS ================= */}
      {classes.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
              KELAS YANG KAMU IKUTI
            </h2>
            <p className="text-[11px] text-slate-500">
              Klik salah satu kartu untuk masuk ke ruang Zoom kelas.
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
                  group relative overflow-hidden rounded-3xl
                  border border-slate-800 bg-slate-950/80
                  p-1 shadow-[0_18px_60px_-45px_rgba(0,0,0,1)]
                  transition hover:-translate-y-1 hover:border-cyan-500/70 hover:shadow-xl
                "
              >
                <div
                  className={`
                    relative h-full rounded-3xl
                    bg-gradient-to-br ${pickPalette(index)}
                    px-4 py-5 md:px-5 md:py-6
                  `}
                >
                  {/* bubble dekorasi */}
                  <div
                    className="pointer-events-none absolute -right-4 -top-6 h-20 w-20 rounded-full bg-white/30 blur-2xl opacity-60"
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute bottom-0 right-3 text-6xl opacity-25 transition duration-700 group-hover:rotate-6 group-hover:scale-110"
                    aria-hidden
                  >
                    {pickIcon(index + 2)}
                  </div>

                  <div className="relative flex items-start gap-3">
                    <div
                      className="
                        flex h-12 w-12 items-center justify-center
                        rounded-2xl bg-white/80 text-2xl shadow-sm
                        backdrop-blur-sm
                      "
                    >
                      {pickIcon(index)}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-900/80">
                        Zoom Class
                      </p>
                      <h3 className="text-base md:text-lg font-black text-slate-950 drop-shadow-sm line-clamp-2">
                        {c.name}
                      </h3>
                      <p className="text-[11px] md:text-xs text-slate-900/80">
                        Klik kartu ini kalau jadwal kelas kamu sudah mulai. 👇
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2 text-[10px] md:text-[11px] font-semibold text-slate-900">
                        <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm">
                          🎧 Live dengan tutor
                        </span>
                        <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm">
                          🧮 Latihan bareng
                        </span>
                        <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm">
                          😊 Bisa tanya-tanya
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="relative mt-4 flex items-center justify-between text-[11px] md:text-xs text-slate-900/80">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Siap masuk kelas
                    </span>
                    <span
                      className="
                        inline-flex items-center gap-1 rounded-full
                        bg-black/10 px-3 py-1 font-semibold
                        group-hover:bg-black/20
                      "
                    >
                      Masuk kelas
                      <span aria-hidden>➜</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
