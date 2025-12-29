// src/app/dashboard/student/schedule/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/app/components/ToastProvider";

type ScheduleRow = {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  classId: number;
  className: string | null;
};

export default function StudentSchedulePage() {
  const toast = useToast();
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch("/api/student/schedule");
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.error || "Gagal memuat jadwal");
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
          <h1 className="text-2xl font-bold text-emerald-800">
            Jadwal Belajar
          </h1>
          <p className="text-sm text-emerald-700">
            Jadwal sesi Zoom 7 hari ke depan.
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
        <div className="rounded-2xl border border-emerald-300/60 bg-white/80 px-5 py-4 text-sm text-emerald-800 shadow-sm">
          Memuat jadwal belajar...
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-emerald-300/60 bg-white/80 px-5 py-6 text-center text-sm text-emerald-700 shadow-sm">
          Belum ada jadwal Zoom 7 hari ke depan.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="rounded-2xl border border-emerald-300/60 bg-linear-to-br from-emerald-50 via-white to-emerald-100 p-5 text-emerald-900 shadow-[0_20px_60px_-45px_rgba(0,0,0,0.6)]"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">
                Sesi Zoom
              </p>
              <h2 className="mt-2 text-lg font-semibold text-emerald-900">
                {row.title}
              </h2>
              <p className="text-xs text-emerald-700">
                {row.className ?? `Kelas #${row.classId}`}
              </p>
              <p className="mt-2 text-xs text-emerald-700">
                {new Date(row.startTime).toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {" - "}
                {new Date(row.endTime).toLocaleString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <Link
                href={`/dashboard/student/classes/${row.classId}/zoom`}
                className="mt-4 inline-flex text-xs text-emerald-700 hover:text-emerald-600"
              >
                Buka kelas
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
