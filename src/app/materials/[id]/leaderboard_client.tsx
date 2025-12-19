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
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-xs text-slate-200">
        Memuat leaderboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-xs text-red-100">
        {error}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-xs text-slate-200">
        Leaderboard belum ada. Jadi yang pertama menyelesaikan materi ini! 🎉
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-xs text-slate-200">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-cyan-300/80">
            Leaderboard Materi
          </p>
          <h3 className="text-base font-bold text-white">
            Nilai terbaik siswa
          </h3>
        </div>
      </div>

      <div className="divide-y divide-slate-800">
        {entries.map((entry) => {
          const highlight =
            entry.isMe || entry.userId === currentUserId ? "border-cyan-500/60 bg-cyan-500/10" : "";

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
                    ? "bg-amber-500/20 text-amber-200 border border-amber-400/60"
                    : entry.rank === 2
                    ? "bg-slate-700/50 text-slate-200 border border-slate-500/60"
                    : entry.rank === 3
                    ? "bg-orange-500/20 text-orange-200 border border-orange-400/60"
                    : "bg-slate-800 text-slate-200 border border-slate-700"
                }`}
              >
                #{entry.rank}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-100">
                  {entry.fullName}
                  {entry.userId === currentUserId && (
                    <span className="ml-2 rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-200">
                      Kamu
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Percobaan ke-{entry.attemptNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-300">
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
