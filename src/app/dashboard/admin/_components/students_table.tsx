"use client";

import { useState } from "react";
import { useToast } from "@/app/components/ToastProvider";
import StudentPremiumToggle from "@/app/dashboard/teacher/StudentPremiumToggle";

type StudentRow = {
  id: string;
  name: string;
  remainingDays: number | null;
  subscriptionId: string | null;
  isPremium: boolean;
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
      <table className="min-w-[640px] w-full text-xs text-slate-700">
        <thead>
          <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-[0.2em] text-slate-500">
            <th className="py-2">Nama</th>
            <th className="py-2">Status</th>
            <th className="py-2">Sisa hari</th>
            <th className="py-2">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {items.map((row) => (
            <tr key={row.id}>
              <td className="py-3 font-semibold text-slate-900">{row.name}</td>
              <td className="py-3">
                {row.isPremium ? (
                  <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    Premium
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    Gratis
                  </span>
                )}
              </td>
              <td className="py-3">
                {row.remainingDays === null
                  ? "-"
                  : `${row.remainingDays} hari`}
              </td>
              <td className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StudentPremiumToggle
                    studentId={row.id}
                    initialIsPremium={row.isPremium}
                    studentName={row.name}
                    showStatus={false}
                  />
                  {row.subscriptionId ? (
                    <button
                      type="button"
                      onClick={() => handleReset(row)}
                      disabled={loadingId === row.subscriptionId}
                      className="rounded-lg border border-rose-500/60 bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                    >
                      {loadingId === row.subscriptionId
                        ? "Memproses..."
                        : "Reset ke Free"}
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={4} className="py-6 text-center text-slate-500">
                Belum ada siswa terdaftar.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
