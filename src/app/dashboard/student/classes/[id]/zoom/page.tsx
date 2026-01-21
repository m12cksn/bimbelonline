// src/app/dashboard/student/classes/[id]/zoom/page.tsx
"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import Image from "next/image";
import { useToast } from "@/app/components/ToastProvider";

type ZoomSession = {
  id: number;
  title: string | null;
  start_time: string;
  end_time: string;
  already_present?: boolean;
};

async function handleJoin(zoomId: number, toast: ReturnType<typeof useToast>) {
  try {
    const res = await fetch(`/api/student/zoom/${zoomId}/join`, {
      method: "GET",
      credentials: "same-origin",
    });

    const json = await res.json();

    if (!res.ok || !json.ok) {
      toast.error(json.error ?? "Gagal join zoom");
      return;
    }

    window.open(json.zoom_link, "_blank", "noopener,noreferrer");
  } catch (e) {
    console.error("join error", e);
    toast.error("Terjadi kesalahan");
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

function getStatusBadgeClass(status: string): string {
  if (status === "Sedang Berlangsung")
    return "bg-emerald-500/20 text-emerald-200 border-emerald-400/70";
  if (status === "Akan Datang")
    return "bg-sky-500/20 text-sky-200 border-sky-400/70";
  return "bg-slate-500/20 text-slate-200 border-slate-500/70";
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
  const [attended, setAttended] = useState<number[]>([]);
  const [attendedIds, setAttendedIds] = useState<number[]>([]); // tetap disimpan supaya struktur mirip aslinya
  const [attendingIds, setAttendingIds] = useState<number[]>([]);
  const toast = useToast();

  async function handleAttend(zoomId: number) {
    if (attended.includes(zoomId) || attendingIds.includes(zoomId)) return;

    setAttendingIds((prev) => [...prev, zoomId]);

    const res = await fetch(`/api/student/zoom/${zoomId}/attendance`, {
      method: "POST",
      credentials: "same-origin",
    });

    const json = await res.json();

    if (!res.ok) {
      toast.error(json.error ?? "Gagal absensi");
      setAttendingIds((prev) => prev.filter((id) => id !== zoomId));
      return;
    }

    setAttended((prev) => [...prev, zoomId]);
    setAttendingIds((prev) => prev.filter((id) => id !== zoomId));

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
        const zoomRes = await fetch(`/api/student/classes/${classId}/zoom`, {
          credentials: "same-origin",
        });
        const zoomJson = await zoomRes.json();

        if (zoomRes.ok && zoomJson.ok && isMounted) {
          setSessions(zoomJson.sessions ?? []);
        }

        const quotaRes = await fetch(
          `/api/student/classes/${classId}/zoom-quota`,
          { credentials: "same-origin" },
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

  if (loading) {
    return (
      <div className="min-h-[60vh] bg-slate-900 px-4 py-6 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-7 w-40 rounded-md bg-slate-700" />
            <div className="h-24 w-full rounded-3xl bg-slate-800" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="h-40 rounded-3xl bg-slate-800" />
              <div className="h-40 rounded-3xl bg-slate-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const quotaUsedPercent =
    quota && quota.allowed > 0
      ? Math.min(100, Math.round((quota.used / quota.allowed) * 100))
      : 0;

  return (
    <div className="min-h-[100vh] bg-slate-50 px-4 py-6 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded bg-indigo-500/20 border border-indigo-400/60 shadow-md">
              <span className="text-2xl">🧑‍🎓</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold  tracking-tight text-slate-700">
                Jadwal Zoom Kelas
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-400">
                Pilih sesi Zoom, absen, dan langsung bergabung. Layout kartu
                dibuat mirip kartu layanan, tapi versi bimbel dan tema gelap.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/student"
            className="inline-flex items-center justify-center rounded border border-slate-700 bg-slate-800 px-4 py-2 text-xs sm:text-sm font-medium text-slate-100 shadow-sm hover:bg-slate-700 transition"
          >
            ← Kembali ke Dashboard
          </Link>
        </div>

        {/* Kuota Card */}
        {quota && (
          <div className="rounded-lg border border-slate-700 bg-linear-to-r from-slate-900 to-slate-800 px-5 py-4 shadow-lg">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-400/50">
                  <span className="text-xl">⏱️</span>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-300">
                    Kuota Zoom Bulan Ini
                  </div>
                  <div className="mt-1 text-sm text-amber-100">
                    Sisa kuota:{" "}
                    <span className="font-semibold">
                      {quota.remaining} / {quota.allowed}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-full sm:w-72">
                <div className="flex items-center justify-between text-[11px] text-amber-200 mb-1">
                  <span>Terpakai</span>
                  <span>{quotaUsedPercent}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: `${quotaUsedPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-900/70 px-6 py-10 text-center shadow-inner">
            <div className="mb-3 text-4xl">📅</div>
            <h2 className="text-base font-semibold text-slate-100">
              Belum ada jadwal Zoom
            </h2>
            <p className="mt-1 max-w-md text-sm text-slate-400">
              Jika guru sudah menjadwalkan kelas, kartu-kartu Zoom akan muncul
              di sini.
            </p>
          </div>
        )}

        {/* Sessions list – card layout seperti contoh */}
        {sessions.length > 0 && (
          <div className="space-y-4">
            {sessions.map((z) => {
              const status = getStatus(z.start_time, z.end_time);
              const statusClass = getStatusBadgeClass(status);
              const ongoing = isOngoing(z.start_time, z.end_time);
              const hasQuota = !!quota && quota.remaining > 0;
              const hasAttendance =
                z.already_present || attended.includes(z.id);

              return (
                <div
                  key={z.id}
                  className="relative flex flex-col md:flex-row overflow-hidden rounded-xl bg-slate-900 border border-slate-700 shadow-xl"
                >
                  {/* Image side (seperti thumbnail pekerjaan di contoh) */}
                  <div className="relative w-full md:w-72 h-40 md:h-auto">
                    {/* Ganti src dengan gambar math/zoom milikmu */}
                    <Image
                      src="/images/zoomboy.webp"
                      width={750}
                      height={750}
                      className="h-full w-full object-cover"
                      alt="Zoom Coding Class"
                    />

                    <div className="absolute inset-0 bg-linear-to-t from-slate-900/70 via-slate-900/10 to-transparent" />
                    <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-slate-900/75 px-3 py-1 text-xs font-medium text-slate-100">
                      <span>💻</span>
                      <span>Coding & Zoom Class</span>
                    </div>
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-indigo-500/80 px-3 py-1 text-xs font-semibold text-white shadow-md">
                      <span>🧑‍🎓</span>
                      <span>Live bersama mentor</span>
                    </div>
                  </div>

                  {/* Content side */}
                  <div className="flex-1 p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Info */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base sm:text-lg font-semibold text-white">
                          {z.title ?? "Sesi Zoom"}
                        </h2>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusClass}`}
                        >
                          {status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span>📅</span>
                          <span>{formatDateTime(z.start_time)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span>⏰</span>
                          <span>
                            Sampai {formatDateTime(z.end_time).split(", ")[1]}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span>🌐</span>
                          <span>Online via Zoom</span>
                        </div>
                      </div>

                      {z.already_present && (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-200 border border-emerald-500/40">
                          <span>✅</span>
                          <span>Kamu sudah absen di sesi ini</span>
                        </div>
                      )}

                      <p className="text-[11px] sm:text-xs text-slate-400 max-w-md">
                        Siapkan buku dan pensil, ya. Kita akan belajar coding
                        sambil diskusi langsung dengan mentor di Zoom.
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-stretch md:items-end gap-2 w-full md:w-auto">
                      {ongoing && (
                        <button
                          disabled={
                            z.already_present ||
                            attended.includes(z.id) ||
                            attendingIds.includes(z.id) ||
                            (quota?.remaining ?? 0) === 0
                          }
                          onClick={() => handleAttend(z.id)}
                          className={`inline-flex items-center justify-center rounded-full px-5 py-2 text-xs sm:text-sm font-semibold text-white transition ${
                            z.already_present ||
                            attended.includes(z.id) ||
                            attendingIds.includes(z.id) ||
                            (quota?.remaining ?? 0) === 0
                              ? "bg-emerald-900/60 cursor-not-allowed"
                              : "bg-emerald-500 hover:bg-emerald-400"
                          }`}
                        >
                          {z.already_present || attended.includes(z.id)
                            ? "Sudah Hadir"
                            : attendingIds.includes(z.id)
                              ? "Memproses..."
                              : quota?.remaining === 0
                                ? "Kuota Habis"
                                : "Absen Hadir"}
                        </button>
                      )}

                      <button
                        onClick={() => handleJoin(z.id, toast)}
                        disabled={!hasQuota || !hasAttendance}
                        className={`inline-flex items-center justify-center rounded-full px-5 py-2 text-xs sm:text-sm font-semibold shadow-md ${
                          !hasQuota || !hasAttendance
                            ? "bg-slate-700 text-slate-300 cursor-not-allowed"
                            : "bg-orange-500 text-white hover:bg-orange-400"
                        }`}
                      >
                        {!hasQuota
                          ? "Zoom Terkunci"
                          : !hasAttendance
                            ? "Absen dulu"
                            : "Join Zoom Sekarang"}
                      </button>

                      <p className="text-[10px] sm:text-[11px] text-slate-400 md:text-right">
                        Tips: klik{" "}
                        <span className="font-semibold">Absen Hadir</span> dulu,
                        lalu <span className="font-semibold">Join Zoom</span>,
                        supaya kuota kamu tercatat rapi.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
