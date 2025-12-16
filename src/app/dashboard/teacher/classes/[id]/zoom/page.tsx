// src/app/dashboard/teacher/classes/[id]/zoom/page.tsx

"use client";
import Link from "next/link";

import { use, useCallback, useEffect, useState } from "react";

type ZoomSession = {
  id: number;
  title: string | null;
  start_time: string;
  end_time: string;
  zoom_link: string;
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatus(start: string, end: string): string {
  const now = Date.now();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();

  if (now < s) return "Akan Datang";
  if (now >= s && now <= e) return "Sedang Berlangsung";
  return "Selesai";
}

export default function TeacherZoomPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const { id: classId } = use(params as Promise<{ id: string }>);

  const [sessions, setSessions] = useState<ZoomSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchZoom = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/teacher/classes/${classId}/zoom`, {
        credentials: "same-origin",
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Gagal memuat jadwal zoom");
        return;
      }

      setSessions(json.sessions ?? []);
    } catch (err) {
      console.error("fetch zoom", err);
      setError("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchZoom();
  }, [fetchZoom]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Jadwal Zoom Kelas</h1>

      {sessions.length === 0 && (
        <div className="text-gray-500">
          Belum ada jadwal zoom untuk kelas ini
        </div>
      )}

      <div className="space-y-4">
        {sessions.map((z) => (
          <div
            key={z.id}
            className="border rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div>
              <div className="font-semibold">{z.title || "Sesi Zoom"}</div>
              <div className="text-sm text-gray-600">
                {formatDateTime(z.start_time)} – {formatDateTime(z.end_time)}
              </div>
              <div className="mt-1 text-sm">
                Status:{" "}
                <span className="font-medium">
                  {getStatus(z.start_time, z.end_time)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <a
                href={z.zoom_link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded text-center"
              >
                Join Zoom
              </a>
              <Link
                href={`/dashboard/teacher/classes/${classId}/attendance/${z.id}`}
                prefetch={false}
                className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Lihat Absensi
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
