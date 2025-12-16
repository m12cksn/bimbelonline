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
      "from-amber-200 to-orange-300",
      "from-sky-200 to-blue-300",
      "from-pink-200 to-rose-300",
      "from-emerald-200 to-teal-300",
      "from-indigo-200 to-purple-300",
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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-linear-to-b from-orange-50 via-white to-sky-50 text-lg font-semibold text-sky-700">
        Membuka halaman ceria...
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-linear-to-b from-orange-50 via-white to-sky-50 p-6 shadow-xl">
      <div
        className="absolute left-8 top-4 h-16 w-16 rounded-full bg-orange-200/60 blur-2xl"
        aria-hidden
      />
      <div
        className="absolute right-10 -bottom-2 h-20 w-20 rounded-full bg-sky-200/70 blur-2xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-4 text-slate-800">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-orange-500">
              Halo, Petualang Belajar!
            </p>
            <h1 className="text-3xl font-black text-sky-800 drop-shadow-sm">
              Kelas Ceria Kamu
            </h1>
            <p className="text-sm text-slate-600">
              Pilih kelas favorit dan mulai belajar dengan semangat!
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setLoading(true);
              load();
            }}
            className="group relative inline-flex items-center gap-2 rounded-full bg-linear-to-r from-sky-400 to-blue-500 px-4 py-2 text-white shadow-lg transition hover:scale-[1.03] hover:shadow-xl active:scale-[0.98]"
          >
            <span className="text-lg">🔄</span>
            <span className="text-sm font-semibold">Segarkan</span>
            <span
              className="absolute inset-0 rounded-full bg-white/10 opacity-0 transition group-hover:opacity-100"
              aria-hidden
            />
          </button>
        </header>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700 shadow-inner">
            <span className="text-lg">😿</span>
            <div className="flex flex-1 flex-col gap-1">
              <p className="font-semibold">Ups! Ada kendala</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {classes.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl bg-white/70 p-8 text-center shadow-inner">
            <span className="text-5xl animate-bounce">🌈</span>
            <p className="text-xl font-bold text-sky-800">Belum ada kelas</p>
            <p className="text-sm text-slate-600">
              Yuk gabung kelas baru dan mulai petualangan belajar!
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c, index) => (
            <Link
              key={c.id}
              href={`/dashboard/student/classes/${c.id}/zoom`}
              className="group relative overflow-hidden rounded-3xl bg-white p-px shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div
                className={`relative h-full rounded-3xl bg-linear-to-br ${pickPalette(
                  index
                )} p-5`}
              >
                <div
                  className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/30 blur-2xl"
                  aria-hidden
                />
                <div className="absolute bottom-2 right-4 text-6xl opacity-20 transition duration-700 group-hover:rotate-6 group-hover:scale-110">
                  {pickIcon(index + 2)}
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 text-2xl shadow-sm backdrop-blur">
                    {pickIcon(index)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <h2 className="text-lg font-black text-sky-900 drop-shadow-sm">
                      {c.name}
                    </h2>
                    <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
                      Klik untuk masuk kelas
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-700">
                      <span className="rounded-full bg-white/70 px-3 py-1 shadow-sm">
                        Materi Seru
                      </span>
                      <span className="rounded-full bg-white/70 px-3 py-1 shadow-sm">
                        Teman Baru
                      </span>
                      <span className="rounded-full bg-white/70 px-3 py-1 shadow-sm">
                        Zoom Langsung
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
