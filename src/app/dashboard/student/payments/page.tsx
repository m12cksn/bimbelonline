// src/app/dashboard/student/payments/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/app/components/ToastProvider";

type PaymentRow = {
  id: string;
  amount: number | null;
  status: string | null;
  createdAt: string | null;
  planName: string | null;
};

function formatRupiah(amount: number | null) {
  if (!amount || Number.isNaN(amount)) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function statusBadge(status: string | null) {
  const normalized = (status || "").toLowerCase();
  if (["paid", "success", "approved", "settlement"].includes(normalized)) {
    return "border-emerald-400/60 bg-emerald-500/15 text-emerald-200";
  }
  if (["pending", "waiting"].includes(normalized)) {
    return "border-amber-400/60 bg-amber-500/15 text-amber-200";
  }
  if (["failed", "expired", "canceled"].includes(normalized)) {
    return "border-rose-400/60 bg-rose-500/15 text-rose-200";
  }
  return "border-slate-700 bg-slate-900 text-slate-200";
}

export default function StudentPaymentsPage() {
  const toast = useToast();
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch("/api/student/payments-history");
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.error || "Gagal memuat riwayat pembayaran");
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
          <h1 className="text-2xl font-bold text-white">Riwayat Pembayaran</h1>
          <p className="text-sm text-slate-400">
            Semua transaksi paket yang pernah kamu lakukan.
          </p>
        </div>
        <Link
          href="/dashboard/student/upgrade"
          className="rounded-xl border border-cyan-400/60 bg-cyan-500/20 px-4 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/30"
        >
          Upgrade paket
        </Link>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-5 py-4 text-sm text-slate-300">
          Memuat riwayat pembayaran...
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-5 py-6 text-center text-sm text-slate-400">
          Belum ada riwayat pembayaran.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-slate-100 shadow-[0_20px_60px_-45px_rgba(0,0,0,1)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Pembayaran
                  </p>
                  <h2 className="mt-2 text-base font-semibold">
                    {row.planName ?? "Paket"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {row.createdAt
                      ? new Date(row.createdAt).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Total</p>
                  <p className="text-sm font-semibold text-slate-50">
                    {formatRupiah(row.amount)}
                  </p>
                  <span
                    className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-widest ${statusBadge(
                      row.status
                    )}`}
                  >
                    {row.status ?? "unknown"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
