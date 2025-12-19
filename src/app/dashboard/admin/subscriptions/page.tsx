// src/app/dashboard/admin/subcriptions/page.tsx
"use client";

import { useEffect, useState } from "react";

type ProfileInfo = {
  full_name: string | null;
  email: string | null;
};

type PlanInfo = {
  name: string | null;
  zoom_per_month: number | null;
};

type QuotaInfo = {
  allowed_sessions: number;
  used_sessions: number;
};

type SubscriptionRow = {
  id: string;
  status?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  user_id?: string | null;

  // relasi join dari API /api/subscriptions
  profiles?: ProfileInfo | null;
  plans?: PlanInfo | null;
  class_student_zoom_quota?: QuotaInfo | null;
};

type ApiListResponse = {
  ok?: boolean;
  subscriptions?: SubscriptionRow[];
  error?: string;
};

type ApiResponse = {
  ok?: boolean;
  created?: number;
  error?: string;
  message?: string;
};

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso; // fallback mentah
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminSubscriptionsPage() {
  const [items, setItems] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [syncingFor, setSyncingFor] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Ambil daftar subscription saat halaman dibuka
  useEffect(() => {
    fetchList();
  }, []);

  async function fetchList() {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/subscriptions", {
        credentials: "same-origin",
      });

      const text = await res.text();
      const ct = res.headers.get("content-type") ?? "";

      if (!ct.includes("application/json")) {
        console.error("Non JSON response:", text);
        setItems([]);
        setMessage("Respons server tidak valid.");
        setLoading(false);
        return;
      }

      const json: ApiListResponse = JSON.parse(text);

      if (!json.ok) {
        setMessage(json.error ?? "Gagal mengambil subscription");
        setItems([]);
        setLoading(false);
        return;
      }

      setItems(json.subscriptions ?? []);
    } catch (err) {
      console.error("fetch subscriptions error:", err);
      setMessage("Gagal mengambil data. Cek console.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate(subscriptionId: string) {
    const yes = confirm("Yakin ingin generate quota untuk subscription ini?");
    if (!yes) return;

    setGeneratingFor(subscriptionId);
    setMessage(null);

    try {
      const res = await fetch("/api/subscriptions/generate_quota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ subscription_id: subscriptionId }),
      });

      const text = await res.text();
      const ct = res.headers.get("content-type") ?? "";
      const json: ApiResponse = ct.includes("application/json")
        ? JSON.parse(text)
        : { ok: false, error: "Non-JSON response" };

      if (res.status === 401) {
        setMessage("Belum login. Silakan login ulang.");
        setGeneratingFor(null);
        return;
      }

      if (!res.ok || !json.ok) {
        setMessage(json.error ?? "Gagal generate quota");
        setGeneratingFor(null);
        return;
      }

      setMessage(`Berhasil generate quota: ${json.created ?? 0}`);
      // optional: refresh list
      fetchList();
    } catch (err) {
      console.error("generate quota error:", err);
      setMessage("Terjadi kesalahan. Cek console.");
    } finally {
      setGeneratingFor(null);
    }
  }

  async function handleSync(subscriptionId: string) {
    const yes = confirm("Sinkronkan kuota Zoom untuk subscription ini?");
    if (!yes) return;

    setSyncingFor(subscriptionId);
    setMessage(null);

    try {
      const res = await fetch(
        `/api/adm/subscriptions/${subscriptionId}/sync-zoom-quota`,
        {
          method: "POST",
          credentials: "same-origin",
        }
      );

      const text = await res.text();
      const ct = res.headers.get("content-type") ?? "";
      const json: ApiResponse = ct.includes("application/json")
        ? JSON.parse(text)
        : { ok: false, error: "Non-JSON response" };

      if (res.status === 401) {
        setMessage("Belum login. Silakan login ulang.");
        setSyncingFor(null);
        return;
      }

      if (!res.ok || !json.ok) {
        setMessage(json.error ?? "Gagal sync kuota");
        setSyncingFor(null);
        return;
      }

      setMessage(json.message ?? "Berhasil sync kuota Zoom.");
      // optional: refresh list
      fetchList();
    } catch (err) {
      console.error("sync quota error:", err);
      setMessage("Terjadi kesalahan saat sync. Cek console.");
    } finally {
      setSyncingFor(null);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Subscriptions (Admin)</h1>

      {message && (
        <div className="mt-2 rounded border border-amber-400/40 bg-amber-100/10 px-4 py-3 text-sm text-amber-50">
          {message}
        </div>
      )}

      <div className="mt-4">
        {loading && <div>Memuat data subscription...</div>}

        {!loading && items.length === 0 && (
          <div className="text-sm text-slate-300">
            Tidak ada subscription ditemukan.
          </div>
        )}

        <ul className="mt-4 space-y-4">
          {items.map((s) => {
            const name = s.profiles?.full_name ?? "Tanpa nama";
            const email = s.profiles?.email ?? "Tanpa email";
            const planName = s.plans?.name ?? s.plan_id ?? "-";
            const allowed = s.class_student_zoom_quota?.allowed_sessions ?? 0;
            const used = s.class_student_zoom_quota?.used_sessions ?? 0;
            const remaining = Math.max(allowed - used, 0);
            const status = (s.status ?? "unknown").toLowerCase();

            const statusColor =
              status === "active"
                ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/40"
                : status === "expired"
                ? "bg-rose-500/15 text-rose-200 border-rose-400/40"
                : "bg-slate-500/20 text-slate-200 border-slate-400/40";

            return (
              <li
                key={s.id}
                className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-100 md:flex-row md:items-center md:justify-between md:px-6"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold">{name}</p>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${statusColor}`}
                    >
                      {status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">{email}</p>

                  <p className="mt-1 text-xs text-slate-300/90">
                    Paket:{" "}
                    <span className="font-medium text-slate-50">
                      {planName}
                    </span>{" "}
                    {s.plans?.zoom_per_month != null && (
                      <span className="text-slate-400">
                        ({s.plans.zoom_per_month} sesi Zoom/bulan)
                      </span>
                    )}
                  </p>

                  <p className="text-xs text-slate-400">
                    Periode:{" "}
                    <span className="font-medium">
                      {formatDate(s.start_at)} → {formatDate(s.end_at)}
                    </span>
                  </p>

                  <p className="text-xs text-slate-300">
                    Kuota Zoom:{" "}
                    <span className="font-semibold text-emerald-200">
                      {used} / {allowed}
                    </span>{" "}
                    <span className="text-slate-400">({remaining} sisa)</span>
                  </p>

                  <p className="text-[11px] text-slate-500 mt-1">
                    Subscription ID: {s.id}
                  </p>
                </div>

                <div className="flex flex-col gap-2 md:items-end">
                  <button
                    onClick={() => handleGenerate(s.id)}
                    disabled={generatingFor !== null || syncingFor !== null}
                    className="w-full rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow disabled:opacity-50 md:w-auto"
                  >
                    {generatingFor === s.id ? "Memproses..." : "Generate Quota"}
                  </button>

                  <button
                    onClick={() => handleSync(s.id)}
                    disabled={syncingFor !== null || generatingFor !== null}
                    className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow disabled:opacity-50 md:w-auto"
                  >
                    {syncingFor === s.id ? "Syncing..." : "Sync Kuota Zoom"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
