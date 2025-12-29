// app/materials/[id]/leaderboard_client.tsx
"use client";

import { useEffect, useState } from "react";

type LeaderboardEntry = {
  rank: number;
  userId: string;
  score: number;
  attemptNumber: number;
  fullName: string;
  isMe: boolean;
};

export default function MaterialLeaderboard({
  materialId,
  currentUserId,
}: {
  materialId: number;
  currentUserId: string;
}) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/materials/${materialId}/leaderboard`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Gagal memuat leaderboard");
        }

        setEntries(data.leaderboard ?? []);
        setError(null);
      } catch (err) {
        console.error("load leaderboard error", err);
        setError(
          err instanceof Error ? err.message : "Gagal memuat leaderboard"
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [materialId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-sm">
        Memuat leaderboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 shadow-sm">
        {error}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-sm">
        Leaderboard belum ada. Jadi yang pertama menyelesaikan materi ini! 🎉
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-emerald-600/80">
            Leaderboard Materi
          </p>
          <h3 className="text-base font-bold text-slate-900">
            Nilai terbaik siswa
          </h3>
        </div>
      </div>

      <div className="divide-y divide-slate-200">
        {entries.map((entry) => {
          const highlight =
            entry.isMe || entry.userId === currentUserId
              ? "border-emerald-300 bg-emerald-50"
              : "";

          return (
            <div
              key={`${entry.userId}-${entry.rank}`}
              className={`flex items-center gap-3 py-2 ${
                highlight || ""
              } rounded-xl px-2`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ${
                  entry.rank === 1
                    ? "border border-amber-200 bg-amber-50 text-amber-700"
                    : entry.rank === 2
                    ? "border border-slate-200 bg-slate-100 text-slate-600"
                    : entry.rank === 3
                    ? "border border-orange-200 bg-orange-50 text-orange-700"
                    : "border border-slate-200 bg-slate-100 text-slate-600"
                }`}
              >
                #{entry.rank}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-900">
                  {entry.fullName}
                  {entry.userId === currentUserId && (
                    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      Kamu
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Percobaan ke-{entry.attemptNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-700">
                  {entry.score}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
