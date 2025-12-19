// src/app/dashboard/teacher/classes/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ClassRow = {
  id: number;
  name: string;
  subject?: string | null;
  total_students?: number | null;
};

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/teacher/classes", {
          credentials: "same-origin",
        });
        const json = await res.json();

        if (!res.ok || !json.ok) {
          setError(json.error ?? "Gagal memuat daftar kelas");
          return;
        }

        setClasses(json.classes ?? []);
      } catch (err) {
        console.error("teacher classes fetch error", err);
        setError("Terjadi kesalahan saat memuat kelas");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return <div className="p-6">Loading kelas...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-400">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">My Classes</h1>
          <p className="text-sm text-slate-300">
            Daftar kelas yang Anda pegang sebagai guru.
          </p>
        </div>
      </div>

      {/* KALAU BELUM ADA KELAS */}
      {classes.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-sm text-slate-200">
          <p className="font-semibold">Belum ada kelas</p>
          <p className="text-xs text-slate-300 mt-1">
            Admin perlu menambahkan Anda ke salah satu kelas terlebih dahulu.
          </p>
        </div>
      )}

      {/* LIST KELAS */}
      <div className="grid gap-4 md:grid-cols-2">
        {classes.map((c) => (
          <div
            key={c.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm"
          >
            <div className="mb-3">
              <h2 className="text-lg font-semibold text-white">{c.name}</h2>
              <p className="text-xs text-slate-300">
                {c.subject ? c.subject : "Kelas bimbingan"} • ID: {c.id}
              </p>
              {typeof c.total_students === "number" && (
                <p className="mt-1 text-xs text-slate-400">
                  👨‍🎓 {c.total_students} siswa terdaftar
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/dashboard/teacher/classes/${c.id}/zoom`}
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-cyan-500/90 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-cyan-400"
              >
                Jadwal Zoom
              </Link>

              <Link
                href={`/dashboard/teacher/classes/${c.id}/students`}
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-violet-500/90 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-violet-400"
              >
                Murid & Kuota
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
