// src/app/dashboard/student/attendance/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/app/components/ToastProvider";

type AttendanceRow = {
  id: string;
  checkedAt: string;
  zoomTitle: string | null;
  zoomStart: string | null;
  classId: number | null;
  className: string | null;
};

export default function StudentAttendancePage() {
  const toast = useToast();
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch("/api/student/attendance-history");
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.error || "Gagal memuat riwayat kehadiran");
        }
        if (mounted) setRows(json.items ?? []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [toast]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-emerald-800">Riwayat Kehadiran</h1>
          <p className="text-sm text-emerald-700">
            Catatan kehadiran sesi Zoom yang sudah kamu ikuti.
          </p>
        </div>
        <Link
          href="/dashboard/student/classes"
          className="rounded-xl border border-emerald-400/60 bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/30"
        >
          Lihat kelas
        </Link>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-emerald-300/60 bg-white/80 px-5 py-4 text-sm text-emerald-800">
          Memuat riwayat kehadiran...
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-emerald-300/60 bg-white/80 px-5 py-6 text-center text-sm text-emerald-700">
          Belum ada kehadiran tercatat.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="rounded-2xl border border-emerald-300/60 bg-white/80 p-4 text-emerald-900 shadow-[0_20px_60px_-45px_rgba(0,0,0,1)]"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">
                Kehadiran
              </p>
              <h2 className="mt-2 text-base font-semibold">
                {row.zoomTitle ?? "Sesi Zoom"}
              </h2>
              <p className="text-xs text-emerald-700">
                {row.className ?? `Kelas #${row.classId ?? "-"}`}
              </p>
              <div className="mt-2 text-xs text-emerald-700">
                Hadir:{" "}
                {new Date(row.checkedAt).toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              {row.classId && (
                <Link
                  href={`/dashboard/student/classes/${row.classId}/zoom`}
                  className="mt-3 inline-flex text-xs text-emerald-700 hover:text-emerald-600"
                >
                  Buka kelas
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
