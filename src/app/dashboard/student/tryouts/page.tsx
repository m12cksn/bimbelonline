"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useToast } from "@/app/components/ToastProvider";

type TryoutRow = {
  id: string;
  materialId: number;
  title: string | null;
  score: number;
  totalQuestions: number;
  correct: number;
  wrong: number;
  createdAt: string;
};

type ChartPoint = {
  label: string;
  score: number;
};

export default function StudentTryoutPage() {
  const toast = useToast();
  const [rows, setRows] = useState<TryoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<string>("all");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch("/api/student/tryouts");
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.error || "Gagal memuat tryout");
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
    if (selectedMaterial === "all") return rows;
    const materialId = Number(selectedMaterial);
    if (!materialId) return rows;
    return rows.filter((row) => row.materialId === materialId);
  }, [rows, selectedMaterial]);

  const chartPoints = useMemo<ChartPoint[]>(() => {
    const slice = filteredRows.slice(0, 10).reverse();
    return slice.map((row, idx) => ({
      label: row.title ?? `Tryout ${idx + 1}`,
      score: row.score ?? 0,
    }));
  }, [filteredRows]);

  const maxScore = chartPoints.reduce((max, p) => Math.max(max, p.score), 0) || 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-emerald-800">Riwayat Tryout</h1>
          <p className="text-sm text-emerald-700">
            Lihat hasil tryout terakhir dan progres nilaimu.
          </p>
        </div>
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
          <Link
            href="/materials"
            className="rounded-xl border border-emerald-400/60 bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/30"
          >
            Mulai tryout
          </Link>
        </div>
      </div>

      <section className="rounded-2xl border border-emerald-300/60 bg-white/80 p-5 text-emerald-900 shadow-[0_20px_60px_-45px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Grafik Progres Tryout</h2>
          <span className="text-[11px] text-emerald-700">10 percobaan terakhir</span>
        </div>
        {chartPoints.length === 0 ? (
          <p className="mt-4 text-sm text-emerald-700">Belum ada data untuk grafik.</p>
        ) : (
          <div className="mt-4 flex items-end gap-2">
            {chartPoints.map((point, idx) => (
              <div key={`${point.label}-${idx}`} className="flex flex-1 flex-col items-center gap-2">
                <div className="relative h-32 w-full overflow-hidden rounded-xl border border-emerald-300/60 bg-white/80">
                  <div
                    className="absolute bottom-0 left-0 w-full rounded-t-xl bg-gradient-to-t from-emerald-500/80 to-teal-500/80"
                    style={{ height: `${Math.round((point.score / maxScore) * 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-emerald-700 text-center line-clamp-2">
                  {point.label}
                </div>
                <div className="text-xs font-semibold text-emerald-800">{point.score}%</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {loading ? (
        <div className="rounded-2xl border border-emerald-300/60 bg-white/80 px-5 py-4 text-sm text-emerald-800">
          Memuat riwayat tryout...
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="rounded-2xl border border-emerald-300/60 bg-white/80 px-5 py-6 text-center text-sm text-emerald-700">
          Belum ada riwayat tryout. Mulai tryout di materi favoritmu.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredRows.map((row) => (
            <div
              key={row.id}
              className="rounded-2xl border border-emerald-300/60 bg-white/80 p-5 text-emerald-900 shadow-[0_20px_60px_-45px_rgba(0,0,0,1)]"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">
                Tryout
              </p>
              <h2 className="mt-2 text-lg font-semibold">
                {row.title ?? `Materi #${row.materialId}`}
              </h2>
              <p className="mt-1 text-xs text-emerald-700">
                {new Date(row.createdAt).toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
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
                  <p className="text-emerald-700">Salah</p>
                  <p className="text-lg font-bold text-rose-500">
                    {row.wrong}
                  </p>
                </div>
              </div>

              <Link
                href={`/materials/${row.materialId}`}
                className="mt-4 inline-flex text-xs text-emerald-700 hover:text-emerald-600"
              >
                Buka materi
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
