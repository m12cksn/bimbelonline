"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/app/components/ToastProvider";

type LeaderboardEntry = {
  rank: number;
  userId: string;
  fullName: string;
  totalAnswered: number;
  correct: number;
  accuracy: number;
  isMe: boolean;
};

type LeaderboardPayload = {
  topCorrect: LeaderboardEntry[];
  mostActive: LeaderboardEntry[];
};

export default function StudentGlobalLeaderboardPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LeaderboardPayload>({
    topCorrect: [],
    mostActive: [],
  });
  const [activeTab, setActiveTab] = useState<"correct" | "active">("correct");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch("/api/leaderboard/global");
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.error || "Gagal memuat leaderboard");
        }
        if (mounted) {
          setData({
            topCorrect: json.topCorrect ?? [],
            mostActive: json.mostActive ?? [],
          });
        }
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
      <div>
        <h1 className="text-2xl font-bold text-emerald-800">Leaderboard Global</h1>
        <p className="text-sm text-emerald-700">
          Lihat siswa paling aktif dan paling banyak menjawab benar.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-700">
        <button
          type="button"
          onClick={() => setActiveTab("correct")}
          className={`rounded-full border px-3 py-1.5 font-semibold transition ${
            activeTab === "correct"
              ? "border-emerald-400/70 bg-emerald-500/20 text-emerald-900"
              : "border-emerald-300/60 bg-white/80 text-emerald-600 hover:border-emerald-400/40"
          }`}
        >
          Paling banyak benar
        </button>
        <span className="text-emerald-700">/</span>
        <button
          type="button"
          onClick={() => setActiveTab("active")}
          className={`rounded-full border px-3 py-1.5 font-semibold transition ${
            activeTab === "active"
              ? "border-emerald-400/70 bg-emerald-500/20 text-emerald-900"
              : "border-emerald-300/60 bg-white/80 text-emerald-600 hover:border-emerald-400/40"
          }`}
        >
          Siswa paling aktif
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-emerald-300/60 bg-white/80 px-5 py-4 text-sm text-emerald-600">
          Memuat leaderboard...
        </div>
      ) : (
        <section className="rounded-2xl border border-emerald-300/60 bg-white/80 p-5 text-emerald-900 shadow-[0_20px_60px_-45px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              {activeTab === "correct"
                ? "Paling Banyak Benar"
                : "Siswa Paling Aktif"}
            </h2>
            <span className="text-[11px] text-emerald-700">Top 20</span>
          </div>
          {activeTab === "correct" ? (
            data.topCorrect.length === 0 ? (
              <p className="mt-3 text-sm text-emerald-700">
                Belum ada data leaderboard.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {data.topCorrect.map((entry) => (
                  <div
                    key={`${entry.userId}-${entry.rank}`}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs ${
                      entry.isMe
                        ? "border-emerald-400/70 bg-emerald-500/10 text-emerald-900"
                        : "border-emerald-300/60 bg-white/80 text-emerald-900"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-300/60 bg-white/80 text-[11px] font-bold">
                        {entry.rank}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-semibold">{entry.fullName}</p>
                        <p className="text-[10px] text-emerald-700">
                          {entry.correct} benar - {entry.totalAnswered} dijawab
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-semibold text-emerald-800">
                        {entry.accuracy}%
                      </div>
                      <div className="text-[10px] text-emerald-700">akurasi</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : data.mostActive.length === 0 ? (
            <p className="mt-3 text-sm text-emerald-700">
              Belum ada data leaderboard.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {data.mostActive.map((entry) => (
                <div
                  key={`${entry.userId}-${entry.rank}`}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs ${
                    entry.isMe
                      ? "border-emerald-400/70 bg-emerald-500/10 text-emerald-900"
                      : "border-emerald-300/60 bg-white/80 text-emerald-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-300/60 bg-white/80 text-[11px] font-bold">
                      {entry.rank}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-semibold">{entry.fullName}</p>
                      <p className="text-[10px] text-emerald-700">
                        {entry.totalAnswered} dijawab - {entry.correct} benar
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-semibold text-emerald-800">
                      {entry.totalAnswered}
                    </div>
                    <div className="text-[10px] text-emerald-700">total</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
