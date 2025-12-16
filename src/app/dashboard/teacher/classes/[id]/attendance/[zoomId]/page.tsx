"use client";

import { useEffect, useState, use } from "react";

type Row = {
  student_id: string;
  name: string;
  email: string;
  present: boolean;
  checked_at: string | null;
};

function formatDateTime(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TeacherAttendancePage({
  params,
}: {
  params:
    | { id: string; zoomId: string }
    | Promise<{ id: string; zoomId: string }>;
}) {
  const { id: classId, zoomId } = use(
    params as Promise<{ id: string; zoomId: string }>
  );

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/teacher/classes/${classId}/zoom/${zoomId}/attendance`,
          { credentials: "same-origin" }
        );
        const json = await res.json();

        if (!res.ok || !json.ok) {
          setError(json.error ?? "Gagal memuat absensi");
          return;
        }

        setRows(json.students ?? []);
      } catch (e) {
        console.error(e);
        setError("Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [classId, zoomId]);

  if (loading) return <div className="p-6">Loading absensi…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Absensi Zoom (Read Only)</h1>

      <table className="w-full border rounded text-sm">
        <thead className="bg-gray-100 text-gray-800">
          <tr>
            <th className="p-3 text-left">Nama</th>
            <th className="p-3 text-left">Email</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Waktu Hadir</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.student_id} className="border-t">
              <td className="p-3 font-medium">{r.name}</td>
              <td className="p-3 text-gray-600">{r.email}</td>
              <td className="p-3">
                {r.present ? (
                  <span className="px-2 py-1 text-xs bg-green-600 text-white rounded">
                    Hadir
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs bg-gray-400 text-white rounded">
                    Tidak Hadir
                  </span>
                )}
              </td>
              <td className="p-3">{formatDateTime(r.checked_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
