// src/app/dashboard/student/_components/upcoming_zoom_widget.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type UpcomingZoomSession = {
  id: number;
  classId: number;
  className: string;
  startTime: string;
  endTime: string | null;
  zoomUrl: string | null;
};

export default function UpcomingZoomWidget() {
  const [sessions, setSessions] = useState<UpcomingZoomSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/student/upcoming-zoom");
      const json = await res.json();

      if (!res.ok || !json.ok) {
        setError(json.error ?? "Gagal memuat jadwal Zoom");
        setSessions([]);
      } else {
        setSessions(json.sessions ?? []);
      }
    } catch (err) {
      console.error("UpcomingZoomWidget load error:", err);
      setError("Tidak dapat terhubung ke server");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const formatDateTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("id-ID", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      });
    } catch {
      return iso;
    }
  };

  return (
    <section
      className="
        relative overflow-hidden rounded-3xl
        border border-slate-800 bg-slate-950/80
        px-5 py-4 md:px-6 md:py-5
        shadow-[0_20px_60px_-45px_rgba(0,0,0,1)]
      "
    >
      {/* dekorasi */}
      <div
        className="pointer-events-none absolute -left-10 top-0 h-24 w-24 rounded-full bg-emerald-500/25 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-12 bottom-0 h-28 w-28 rounded-full bg-sky-500/25 blur-2xl"
        aria-hidden
      />

      <div className="relative z-10 flex flex-col gap-4">
        {/* header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-300/80">
              Upcoming Zoom
            </p>
            <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              Jadwal Zoom terdekat
              <span className="text-base">📅</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-300">
              Lihat kelas Zoom yang akan datang. Klik untuk masuk ke ruang kelas
              atau lihat detail kelas.
            </p>
          </div>

          <button
            type="button"
            onClick={load}
            className="
              inline-flex items-center gap-2 rounded-full
              bg-emerald-500/80 hover:bg-emerald-400
              px-3 py-1.5 text-xs font-semibold text-white
              shadow-md shadow-emerald-500/40
              transition
            "
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>

        {/* content */}
        {loading ? (
          <div className="flex items-center gap-3 rounded-2xl bg-slate-900/60 px-4 py-3 text-sm text-slate-200">
            <span className="text-lg animate-spin">🌀</span>
            <span>Mencari jadwal Zoom terdekat...</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 rounded-2xl bg-red-900/40 px-4 py-3 text-sm text-red-100 border border-red-600/40">
            <span className="text-lg">😿</span>
            <div>
              <p className="font-semibold">Ups, ada kendala</p>
              <p className="text-xs">{error}</p>
            </div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-start gap-2 rounded-2xl bg-slate-900/60 px-4 py-3 text-sm text-slate-200">
            <span className="text-2xl">🌈</span>
            <p className="font-semibold">
              Belum ada jadwal Zoom yang akan datang
            </p>
            <p className="text-xs text-slate-400">
              Kalau kamu sudah terdaftar di kelas, jadwal Zoom akan muncul di
              sini. Kamu juga bisa cek daftar kelas di halaman{" "}
              <Link
                href="/dashboard/student/classes"
                className="font-semibold text-emerald-300 underline-offset-2 hover:underline"
              >
                My Classes
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s, index) => (
              <div
                key={s.id}
                className={`
                  relative overflow-hidden rounded-2xl border
                  ${
                    index === 0
                      ? "border-emerald-400/60 bg-emerald-500/10"
                      : "border-slate-800 bg-slate-900/60"
                  }
                  px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between
                  transition hover:border-emerald-400/80 hover:bg-emerald-500/15
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-lg">
                    {index === 0 ? "⭐" : "📚"}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300/90">
                      {index === 0 ? "Next session" : "Upcoming"}
                    </p>
                    <p className="text-sm md:text-base font-semibold text-slate-50 line-clamp-1">
                      {s.className}
                    </p>
                    <p className="text-xs text-slate-300">
                      {formatDateTime(s.startTime)}
                      {s.endTime && (
                        <>
                          {" "}
                          • s/d{" "}
                          <span className="font-medium">
                            {new Date(s.endTime).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZone: "Asia/Jakarta",
                            })}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:justify-end mt-1 md:mt-0">
                  <Link
                    href={`/dashboard/student/classes/${s.classId}/zoom`}
                    className="
                      inline-flex items-center justify-center gap-1
                      rounded-full bg-sky-500/80 hover:bg-sky-400
                      px-3 py-1.5 text-xs font-semibold text-white
                      shadow-sm shadow-sky-500/40
                      transition
                    "
                  >
                    🎥 Masuk kelas
                  </Link>

                  {s.zoomUrl && (
                    <a
                      href={s.zoomUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="
                        inline-flex items-center justify-center gap-1
                        rounded-full border border-emerald-400/70
                        bg-transparent px-3 py-1.5 text-[11px] font-medium
                        text-emerald-200 hover:bg-emerald-500/10
                        transition
                      "
                    >
                      🔗 Buka link Zoom
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
