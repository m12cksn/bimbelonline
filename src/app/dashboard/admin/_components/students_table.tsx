"use client";

import { useState } from "react";
import { useToast } from "@/app/components/ToastProvider";

type StudentRow = {
  id: string;
  name: string;
  email: string | null;
  planName: string;
  joinDate: string;
  endDate: string;
  remainingDays: number | null;
  subscriptionId: string | null;
};

type Props = {
  rows: StudentRow[];
};

export default function StudentsTable({ rows }: Props) {
  const toast = useToast();
  const [items, setItems] = useState(rows);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleReset(row: StudentRow) {
    if (!row.subscriptionId) return;
    const ok = window.confirm(
      `Reset subscription ${row.name} ke Free?`
    );
    if (!ok) return;
    setLoadingId(row.subscriptionId);
    try {
      const res = await fetch(
        `/api/adm/subscriptions/${row.subscriptionId}/cancel`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Gagal reset subscription");
      }
      setItems((prev) =>
        prev.map((item) =>
          item.id === row.id
            ? {
                ...item,
                planName: "Free",
                joinDate: "-",
                endDate: "-",
                remainingDays: null,
                subscriptionId: null,
              }
            : item
        )
      );
      toast.success("Subscription berhasil direset ke Free.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[900px] w-full text-xs text-slate-700">
        <thead>
          <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-[0.2em] text-slate-500">
            <th className="py-2">Nama</th>
            <th className="py-2">Email</th>
            <th className="py-2">Paket</th>
            <th className="py-2">Join</th>
            <th className="py-2">Selesai</th>
            <th className="py-2">Sisa hari</th>
            <th className="py-2">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {items.map((row) => (
            <tr key={row.id}>
              <td className="py-3 font-semibold text-slate-900">{row.name}</td>
              <td className="py-3 text-slate-600">{row.email ?? "-"}</td>
              <td className="py-3">{row.planName}</td>
              <td className="py-3">{row.joinDate}</td>
              <td className="py-3">{row.endDate}</td>
              <td className="py-3">
                {row.remainingDays === null
                  ? "-"
                  : `${row.remainingDays} hari`}
              </td>
              <td className="py-3">
                {row.subscriptionId ? (
                  <button
                    type="button"
                    onClick={() => handleReset(row)}
                    disabled={loadingId === row.subscriptionId}
                    className="rounded-lg border border-rose-400/60 bg-rose-500/20 px-3 py-1.5 text-[11px] font-semibold text-rose-100 hover:bg-rose-500/30 disabled:opacity-60"
                  >
                    {loadingId === row.subscriptionId ? "Memproses..." : "Reset ke Free"}
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-500">-</span>
                )}
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={7} className="py-6 text-center text-slate-500">
                Belum ada siswa terdaftar.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
