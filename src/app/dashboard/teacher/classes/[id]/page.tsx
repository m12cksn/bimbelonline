"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Student = {
  id: string;
  name: string;
  email: string | null;
};

type ClassDetail = {
  id: number;
  name: string;
  subject: string;
  grade: number | null;
  description?: string | null;
};

export default function TeacherClassDetailPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  // unwrap params (Next App Router safe)
  const { id: classId } = use(params as Promise<{ id: string }>);

  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/teacher/classes/${classId}`, {
        credentials: "same-origin",
      });

      const text = await res.text();
      const ct = res.headers.get("content-type") ?? "";

      if (!ct.includes("application/json")) {
        setError("Respons server tidak valid");
        return;
      }

      const json = JSON.parse(text) as {
        ok?: boolean;
        class?: ClassDetail;
        students?: Student[];
        error?: string;
      };

      if (!res.ok || !json.ok) {
        setError(json.error ?? "Gagal memuat kelas");
        return;
      }

      setClassData(json.class ?? null);
      setStudents(json.students ?? []);
    } catch (err) {
      console.error("fetchDetail error", err);
      setError("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  if (!classData) {
    return <div className="p-6">Data kelas tidak ditemukan</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{classData.name}</h1>
        <p className="text-gray-600">
          {classData.subject} • Kelas {classData.grade ?? "-"}
        </p>
        {classData.description && (
          <p className="mt-2 text-sm text-gray-500">{classData.description}</p>
        )}
      </div>

      {/* Action */}
      <div>
        <Link
          href={`/dashboard/teacher/classes/${classId}/zoom`}
          prefetch={false}
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded"
        >
          Jadwal Zoom Kelas
        </Link>
      </div>

      {/* Students */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Daftar Murid</h2>

        <div className="overflow-x-auto">
          <table className="w-full border rounded">
            <thead className="bg-gray-100 text-gray-800">
              <tr>
                <th className="p-3 text-left">Nama</th>
                <th className="p-3 text-left">Email</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 && (
                <tr>
                  <td colSpan={2} className="p-4 text-center text-gray-500">
                    Belum ada murid di kelas ini
                  </td>
                </tr>
              )}

              {students.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="p-3 font-medium">{s.name}</td>
                  <td className="p-3 text-gray-600">{s.email ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
