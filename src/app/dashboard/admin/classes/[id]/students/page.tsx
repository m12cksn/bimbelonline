"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

interface StudentRow {
  id: number;
  class_id: number;
  student_id: string;
  added_at?: string | null;
}

interface Profile {
  id: string;
  full_name?: string | null;
  email?: string | null;
}

/**
 * Props.params bisa datang sebagai Promise di Next.js App Router modern.
 * Kita terima kedua kemungkinan dan unwrap dengan React.use().
 */
export default function ClassStudentsPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  // unwrap params (support sync or Promise)
  const { id: classId } = use(params as Promise<{ id: string }>);

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  async function fetchStudents() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/adm/classes/${classId}/students-list`, {
        credentials: "same-origin",
      });
      const text = await res.text();
      const ct = res.headers.get("content-type") ?? "";

      if (!ct.includes("application/json")) {
        setError("Server mengirim respons tidak valid");
        setStudents([]);
        setProfiles({});
        return;
      }

      const json = JSON.parse(text) as {
        ok?: boolean;
        students?: StudentRow[];
        profiles?: Profile[];
        error?: string;
      };

      if (!json.ok) {
        setError(json.error ?? "Gagal memuat siswa");
        setStudents([]);
        setProfiles({});
        return;
      }

      setStudents(json.students ?? []);

      const profileMap: Record<string, Profile> = {};
      (json.profiles ?? []).forEach((p) => {
        profileMap[p.id] = p;
      });
      setProfiles(profileMap);
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat memuat data siswa");
      setStudents([]);
      setProfiles({});
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Students in Class {classId}</h1>

        {/* Tombol Add Student */}
        <Link
          href={`/dashboard/admin/classes/${classId}/assign-student`}
          prefetch={false}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Add Student
        </Link>
      </div>

      {loading && <div className="mt-4">Memuat siswa...</div>}

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">{error}</div>
      )}

      <table className="mt-6 w-full border-collapse">
        <thead>
          <tr className="bg-gray-900 border">
            <th className="p-2 border">Nama</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Student ID</th>
            <th className="p-2 border">Added At</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 && !loading && (
            <tr>
              <td colSpan={4} className="p-4 text-center text-gray-500">
                Belum ada siswa dalam kelas ini.
              </td>
            </tr>
          )}

          {students.map((s) => {
            const p = profiles[s.student_id];
            return (
              <tr
                key={s.id}
                className="border hover:bg-gray-50 hover:text-gray-900"
              >
                <td className="p-2 border">{p?.full_name ?? "-"}</td>
                <td className="p-2 border">{p?.email ?? "-"}</td>
                <td className="p-2 border">{s.student_id}</td>
                <td className="p-2 border">{s.added_at ?? "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
