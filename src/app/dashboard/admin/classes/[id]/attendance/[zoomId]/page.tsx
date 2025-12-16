"use client";

import { use, useEffect, useState } from "react";

type AttendanceRow = {
  student_id: string;
  name: string;
  email: string;
  present: boolean;
  checked_at: string | null;
  quota: {
    allowed: number;
    used: number;
    remaining: number;
  } | null;
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminAttendanceDetailPage({
  params,
}: {
  params:
    | { id: string; zoomId: string }
    | Promise<{ id: string; zoomId: string }>;
}) {
  const { id: classId, zoomId } = use(
    params as Promise<{ id: string; zoomId: string }>
  );

  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/adm/classes/${classId}/zoom/${zoomId}/attendance`,
          { credentials: "same-origin" }
        );

        const json = await res.json();
        if (!res.ok || !json.ok) {
          setError(json.error ?? "Gagal memuat absensi");
          return;
        }

        setRows(json.students ?? []);
      } catch (err) {
        console.error("fetch attendance ui", err);
        setError("Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [classId, zoomId]);

  if (loading) {
    return <div className="p-6">Loading absensi...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  const total = rows.length;
  const hadir = rows.filter((r) => r.present).length;
  const tidakHadir = total - hadir;

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Detail Absensi Zoom</h1>
        <p className="text-gray-600">
          Class ID {classId} • Zoom ID {zoomId}
        </p>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded bg-gray-100">
          <div className="text-sm text-gray-600">Total Murid</div>
          <div className="text-2xl text-gray-800 font-bold">{total}</div>
        </div>
        <div className="p-4 rounded bg-green-100 text-green-800">
          <div className="text-sm">Hadir</div>
          <div className="text-2xl font-bold">{hadir}</div>
        </div>
        <div className="p-4 rounded bg-red-100 text-red-800">
          <div className="text-sm">Belum Hadir</div>
          <div className="text-2xl font-bold">{tidakHadir}</div>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-800">
            <tr>
              <th className="p-3 text-left">Nama</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Waktu Hadir</th>
              <th className="p-3 text-left">Kuota Zoom</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  Belum ada data absensi
                </td>
              </tr>
            )}

            {rows.map((r) => (
              <tr key={r.student_id} className="border-t">
                <td className="p-3 font-medium">{r.name}</td>
                <td className="p-3 text-gray-600">{r.email}</td>
                <td className="p-3">
                  {r.present ? (
                    <span className="px-2 py-1 rounded text-xs bg-green-600 text-white">
                      Hadir
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded text-xs bg-gray-400 text-white">
                      Tidak Hadir
                    </span>
                  )}
                </td>
                <td className="p-3">{formatDateTime(r.checked_at)}</td>
                <td className="p-3">
                  {r.quota ? (
                    <span>
                      {r.quota.used} / {r.quota.allowed}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
