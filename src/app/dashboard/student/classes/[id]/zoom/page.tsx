// src/app/dashboard/student/classes/[id]/zoom/page.tsx
"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

type ZoomSession = {
  id: number;
  title: string | null;
  start_time: string;
  end_time: string;
  already_present?: boolean;
};

async function handleJoin(zoomId: number) {
  try {
    const res = await fetch(`/api/student/zoom/${zoomId}/join`, {
      method: "GET",
      credentials: "same-origin",
    });

    const json = await res.json();

    if (!res.ok || !json.ok) {
      alert(json.error ?? "Gagal join zoom");
      return;
    }

    window.open(json.zoom_link, "_blank", "noopener,noreferrer");
  } catch (e) {
    console.error("join error", e);
    alert("Terjadi kesalahan");
  }
}

type ZoomQuota = {
  allowed: number;
  used: number;
  remaining: number;
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function isOngoing(start: string, end: string): boolean {
  const now = Date.now();
  return now >= new Date(start).getTime() && now <= new Date(end).getTime();
}

function getStatus(start: string, end: string): string {
  const now = Date.now();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();

  if (now < s) return "Akan Datang";
  if (now >= s && now <= e) return "Sedang Berlangsung";
  return "Selesai";
}

export default function StudentZoomPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const { id: classId } = use(params as Promise<{ id: string }>);

  const [sessions, setSessions] = useState<ZoomSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [quota, setQuota] = useState<ZoomQuota | null>(null);
  const [attendedIds, setAttendedIds] = useState<number[]>([]);
  const [attended, setAttended] = useState<number[]>([]);

  async function handleAttend(zoomId: number) {
    if (attended.includes(zoomId)) return;

    const res = await fetch(`/api/student/zoom/${zoomId}/attendance`, {
      method: "POST",
      credentials: "same-origin",
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json.error ?? "Gagal absensi");
      return;
    }

    setAttended((prev) => [...prev, zoomId]);

    // refresh quota
    const quotaRes = await fetch(`/api/student/classes/${classId}/zoom-quota`, {
      credentials: "same-origin",
    });
    const quotaJson = await quotaRes.json();
    if (quotaRes.ok && quotaJson.ok) {
      setQuota(quotaJson.quota);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadAll() {
      try {
        // fetch zoom sessions
        const zoomRes = await fetch(`/api/student/classes/${classId}/zoom`, {
          credentials: "same-origin",
        });
        const zoomJson = await zoomRes.json();

        if (zoomRes.ok && zoomJson.ok && isMounted) {
          setSessions(zoomJson.sessions ?? []);
        }

        // fetch quota
        const quotaRes = await fetch(
          `/api/student/classes/${classId}/zoom-quota`,
          { credentials: "same-origin" }
        );
        const quotaJson = await quotaRes.json();

        if (quotaRes.ok && quotaJson.ok && isMounted) {
          setQuota(quotaJson.quota);
        }
      } catch (err) {
        console.error("load zoom page error", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAll();

    return () => {
      isMounted = false;
    };
  }, [classId]);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Jadwal Zoom</h1>

      {quota && (
        <div className="p-3 rounded bg-yellow-100 text-yellow-800">
          Sisa kuota Zoom: <strong>{quota.remaining}</strong> / {quota.allowed}
        </div>
      )}

      {sessions.length === 0 && (
        <p className="text-gray-500">Belum ada jadwal zoom</p>
      )}

      {sessions.map((z) => (
        <div key={z.id} className="border rounded p-4">
          <div className="font-semibold">{z.title ?? "Sesi Zoom"}</div>
          <div className="text-sm text-gray-600">
            {formatDateTime(z.start_time)} – {formatDateTime(z.end_time)}
          </div>
          <div className="text-sm mt-1">
            Status: <strong>{getStatus(z.start_time, z.end_time)}</strong>
          </div>
          {isOngoing(z.start_time, z.end_time) && (
            <button
              disabled={z.already_present || quota?.remaining === 0}
              onClick={() => handleAttend(z.id)}
              className={`mt-2 px-4 py-2 rounded text-white ${
                z.already_present || quota?.remaining === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600"
              }`}
            >
              {z.already_present
                ? "Sudah Hadir"
                : quota?.remaining === 0
                ? "Kuota Habis"
                : "Hadir"}
            </button>
          )}

          <button
            onClick={() => handleJoin(z.id)}
            disabled={!quota || quota.remaining <= 0}
            className={`inline-block mt-2 px-4 py-2 rounded text-white ${
              !quota || quota.remaining <= 0
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-blue-600"
            }`}
          >
            {!quota || quota.remaining <= 0
              ? "Zoom Terkunci (Kuota Habis)"
              : "Join Zoom"}
          </button>
        </div>
      ))}
    </div>
  );
}
