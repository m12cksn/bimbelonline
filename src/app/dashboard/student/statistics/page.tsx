// src/app/dashboard/student/statistics/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useToast } from "@/app/components/ToastProvider";

type AttemptRow = {
  id: string;
  materialId: number;
  title: string | null;
  mode: "practice" | "tryout";
  attemptNumber: number | null;
  score: number;
  correct: number;
  wrong: number;
  totalQuestions: number;
  createdAt: string;
};

type ChartPoint = {
  label: string;
  score: number;
};

const rangeOptions = [
  { value: "all", label: "Semua waktu" },
  { value: "30", label: "30 hari" },
  { value: "90", label: "90 hari" },
  { value: "365", label: "1 tahun" },
];

export default function StudentStatisticsPage() {
  const toast = useToast();
  const [rows, setRows] = useState<AttemptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState("all");
  const [selectedMode, setSelectedMode] = useState("all");
  const [selectedRange, setSelectedRange] = useState("90");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch("/api/student/attempts-history");
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.error || "Gagal memuat statistik");
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

  const filteredRows = useMemo(() => {
    const now = Date.now();
    const range = Number(selectedRange);
    return rows.filter((row) => {
      if (selectedMaterial !== "all") {
        const materialId = Number(selectedMaterial);
        if (materialId && row.materialId !== materialId) return false;
      }

      if (selectedMode !== "all" && row.mode !== selectedMode) return false;

      if (!Number.isNaN(range)) {
        const created = new Date(row.createdAt).getTime();
        if (Number.isNaN(created)) return false;
        const diffDays = (now - created) / (1000 * 60 * 60 * 24);
        if (diffDays > range) return false;
      }

      return true;
    });
  }, [rows, selectedMaterial, selectedMode, selectedRange]);

  const chartPoints = useMemo<ChartPoint[]>(() => {
    const slice = filteredRows.slice(0, 12).reverse();
    return slice.map((row, idx) => ({
      label: row.title ?? `Materi #${row.materialId} (${idx + 1})`,
      score: row.score ?? 0,
    }));
  }, [filteredRows]);

  const maxScore = chartPoints.reduce((max, p) => Math.max(max, p.score), 0) || 100;

  const summary = useMemo(() => {
    const total = filteredRows.length;
    const avg =
      total > 0
        ? Math.round(
            filteredRows.reduce((sum, row) => sum + (row.score ?? 0), 0) / total
          )
        : 0;
    const best = filteredRows.reduce(
      (max, row) => Math.max(max, row.score ?? 0),
      0
    );
    const practiceCount = filteredRows.filter((row) => row.mode === "practice").length;
    const tryoutCount = filteredRows.filter((row) => row.mode === "tryout").length;
    return { total, avg, best, practiceCount, tryoutCount };
  }, [filteredRows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-emerald-800">Progress & Statistik</h1>
          <p className="text-sm text-emerald-700">
            Lihat perkembangan nilaimu dan riwayat latihan/tryout.
          </p>
        </div>
        <Link
          href="/materials"
          className="rounded-xl border border-emerald-400/60 bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/30"
        >
          Mulai latihan
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-emerald-300/60 bg-white/80 px-4 py-4 text-emerald-900">
          <p className="text-xs text-emerald-700">Total attempt</p>
          <p className="mt-2 text-2xl font-bold text-emerald-300">
            {summary.total}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-300/60 bg-white/80 px-4 py-4 text-emerald-900">
          <p className="text-xs text-emerald-700">Rata-rata skor</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {summary.avg}%
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-300/60 bg-white/80 px-4 py-4 text-emerald-900">
          <p className="text-xs text-emerald-700">Skor terbaik</p>
          <p className="mt-2 text-2xl font-bold text-amber-300">
            {summary.best}%
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-300/60 bg-white/80 px-4 py-4 text-emerald-900">
          <p className="text-xs text-emerald-700">Practice / Tryout</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {summary.practiceCount} / {summary.tryoutCount}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-300/60 bg-white/80 p-5 text-emerald-900 shadow-[0_20px_60px_-45px_rgba(0,0,0,1)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Grafik perkembangan nilai</h2>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-xl border border-emerald-300/60 bg-white/80 px-3 py-2 text-xs text-emerald-900"
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
            >
              <option value="all">Semua materi</option>
              {Array.from(
                new Map(
                  rows.map((row) => [
                    row.materialId,
                    row.title ?? `Materi #${row.materialId}`,
                  ])
                )
              ).map(([id, title]) => (
                <option key={id} value={String(id)}>
                  {title}
                </option>
              ))}
            </select>

            <select
              className="rounded-xl border border-emerald-300/60 bg-white/80 px-3 py-2 text-xs text-emerald-900"
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
            >
              <option value="all">Semua mode</option>
              <option value="practice">Latihan</option>
              <option value="tryout">Tryout</option>
            </select>

            <select
              className="rounded-xl border border-emerald-300/60 bg-white/80 px-3 py-2 text-xs text-emerald-900"
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
            >
              {rangeOptions.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-emerald-700">Memuat statistik...</p>
        ) : chartPoints.length === 0 ? (
          <p className="mt-4 text-sm text-emerald-700">
            Belum ada data untuk grafik pada filter ini.
          </p>
        ) : (
          <div className="mt-4 flex items-end gap-2">
            {chartPoints.map((point, idx) => (
              <div key={`${point.label}-${idx}`} className="flex flex-1 flex-col items-center gap-2">
                <div className="relative h-28 w-full overflow-hidden rounded-xl border border-emerald-300/60 bg-white/80">
                  <div
                    className="absolute bottom-0 left-0 w-full rounded-t-xl bg-gradient-to-t from-emerald-500/80 to-teal-500/80"
                    style={{ height: `${Math.round((point.score / maxScore) * 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-emerald-700 text-center line-clamp-2">
                  {point.label}
                </div>
                <div className="text-xs font-semibold text-emerald-200">
                  {point.score}%
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-emerald-800">Riwayat attempt</h2>
          <span className="text-xs text-emerald-700">
            {filteredRows.length} data
          </span>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-emerald-300/60 bg-white/80 px-5 py-4 text-sm text-emerald-800">
            Memuat riwayat attempt...
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="rounded-2xl border border-emerald-300/60 bg-white/80 px-5 py-6 text-center text-sm text-emerald-700">
            Belum ada attempt pada filter ini.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredRows.map((row) => (
              <div
                key={`${row.mode}-${row.id}`}
                className="rounded-2xl border border-emerald-300/60 bg-white/80 p-5 text-emerald-900 shadow-[0_20px_60px_-45px_rgba(0,0,0,1)]"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">
                  {row.mode === "tryout" ? "Tryout" : "Latihan"}
                </p>
                <h3 className="mt-2 text-lg font-semibold">
                  {row.title ?? `Materi #${row.materialId}`}
                </h3>
                <p className="text-xs text-emerald-700">
                  {row.createdAt
                    ? new Date(row.createdAt).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-xl border border-emerald-300/60 bg-white/80 px-3 py-2 text-center">
                    <p className="text-emerald-700">Skor</p>
                    <p className="text-lg font-bold text-emerald-300">
                      {row.score}%
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-300/60 bg-white/80 px-3 py-2 text-center">
                    <p className="text-emerald-700">Benar</p>
                    <p className="text-lg font-bold text-emerald-700">
                      {row.correct}
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-300/60 bg-white/80 px-3 py-2 text-center">
                    <p className="text-emerald-700">Total</p>
                    <p className="text-lg font-bold text-emerald-900">
                      {row.totalQuestions}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-emerald-800">
                  <span className="rounded-full border border-emerald-300/60 px-3 py-1">
                    Attempt #{row.attemptNumber ?? "-"}
                  </span>
                  <Link
                    href={`/dashboard/student/materials/${row.materialId}/analysis`}
                    className="text-emerald-700 hover:text-emerald-600"
                  >
                    Lihat pembahasan
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
