"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

type AttendanceSession = {
  id: number;
  title: string | null;
  start_time: string;
  end_time: string;
  total_present: number;
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminClassAttendancePage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const { id: classId } = use(params as Promise<{ id: string }>);

  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/adm/classes/${classId}/attendance`, {
          credentials: "same-origin",
        });
        const json = await res.json();

        if (!res.ok || !json.ok) {
          setError(json.error ?? "Gagal memuat absensi");
          return;
        }

        setSessions(json.sessions ?? []);
      } catch (err) {
        console.error("fetch attendance admin", err);
        setError("Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [classId]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Rekap Absensi Zoom</h1>
        <p className="text-gray-600">Class ID: {classId}</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border rounded">
          <thead className="bg-gray-100 text-gray-900">
            <tr>
              <th className="p-3 text-left">Judul Sesi</th>
              <th className="p-3 text-left">Waktu</th>
              <th className="p-3 text-center">Hadir</th>
              <th className="p-3 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {sessions.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  Belum ada sesi Zoom
                </td>
              </tr>
            )}

            {sessions.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-3 font-medium">{s.title ?? "Sesi Zoom"}</td>
                <td className="p-3 text-sm text-gray-600">
                  {formatDateTime(s.start_time)} – {formatDateTime(s.end_time)}
                </td>
                <td className="p-3 text-center font-semibold">
                  {s.total_present}
                </td>
                <td className="p-3 text-center">
                  <Link
                    href={`/dashboard/admin/classes/${classId}/attendance/${s.id}`}
                    prefetch={false}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm"
                  >
                    Detail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
