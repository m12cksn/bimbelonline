// src/app/dashboard/teacher/classes/[id]/students/page.tsx
"use client";

import { use, useEffect, useState } from "react";

type StudentRow = {
  student_id: string;
  name: string;
  email: string;
  quota: {
    allowed: number;
    used: number;
    remaining: number;
  } | null;
};

export default function TeacherClassStudentsPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  // ambil classId dari params (pakai React.use() seperti di file-file lain)
  const { id: classId } = use(params as Promise<{ id: string }>);

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/teacher/classes/${classId}/students`, {
          credentials: "same-origin",
        });

        const json = await res.json();

        if (!res.ok || !json.ok) {
          setError(json.error ?? "Gagal memuat murid");
          return;
        }

        setStudents(json.students ?? []);
      } catch (err) {
        console.error("teacher students fetch error", err);
        setError("Terjadi kesalahan saat memuat murid");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [classId]);

  if (loading) {
    return <div className="p-6">Loading murid...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-400">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Murid & Kuota Zoom</h1>
          <p className="text-sm text-slate-300">
            Daftar murid di kelas ini beserta kuota Zoom mereka.
          </p>
        </div>
      </div>

      {/* KALAU TIDAK ADA MURID */}
      {students.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-sm text-slate-200">
          <p className="font-semibold">Belum ada murid</p>
          <p className="text-xs text-slate-300 mt-1">
            Admin perlu menambahkan murid ke kelas ini terlebih dahulu.
          </p>
        </div>
      )}

      {/* TABEL MURID */}
      {students.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
          <table className="w-full text-sm">
            <thead className="bg-white/10 text-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Nama</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Kuota Zoom</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.student_id} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                  <td className="px-4 py-3 text-slate-200">{s.email}</td>
                  <td className="px-4 py-3">
                    {s.quota ? (
                      <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                        {s.quota.used} / {s.quota.allowed} digunakan
                        <span className="ml-2 text-[10px] text-cyan-300/80">
                          (sisa {s.quota.remaining})
                        </span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">
                        Belum ada kuota
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
