"use client";

import { useState } from "react";
import { useToast } from "@/app/components/ToastProvider";
import StudentPremiumToggle from "@/app/dashboard/teacher/StudentPremiumToggle";
import { confirmAction } from "@/lib/alerts";

type StudentRow = {
  id: string;
  name: string;
  remainingDays: number | null;
  subscriptionId: string | null;
  isPremium: boolean;
  gradeIds: number[];
};

type Props = {
  rows: StudentRow[];
  grades: Array<{ id: number; name: string; level: number }>;
};

export default function StudentsTable({ rows, grades }: Props) {
  const toast = useToast();
  const [items, setItems] = useState(rows);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [gradeModalId, setGradeModalId] = useState<string | null>(null);
  const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
  const gradeLookup = new Map(grades.map((g) => [g.id, g.name]));

  async function handleReset(row: StudentRow) {
    if (!row.subscriptionId) return;
    const ok = await confirmAction({
      title: "Reset subscription",
      text: `Reset subscription ${row.name} ke Free?`,
      confirmText: "Reset",
      cancelText: "Batal",
    });
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

  async function handleSaveGrades(studentId: string) {
    try {
      setLoadingId(studentId);
      const res = await fetch(`/api/adm/students/${studentId}/grades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gradeIds: selectedGrades }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Gagal menyimpan grade");
      }
      setItems((prev) =>
        prev.map((item) =>
          item.id === studentId ? { ...item, gradeIds: selectedGrades } : item
        )
      );
      toast.success("Grade siswa diperbarui.");
      setGradeModalId(null);
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
              <td className="py-3 font-semibold text-slate-900">
                <div>{row.name}</div>
                <div className="mt-1 text-[10px] font-normal text-slate-500">
                  Kelas:{" "}
                  {row.gradeIds.length === 0
                    ? "-"
                    : row.gradeIds
                        .map((id) => gradeLookup.get(id) ?? id)
                        .join(", ")}
                </div>
              </td>
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
                  <button
                    type="button"
                    onClick={() => {
                      setGradeModalId(row.id);
                      setSelectedGrades(row.gradeIds ?? []);
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Atur Grade
                  </button>
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

      {gradeModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Atur Grade Siswa
              </h3>
              <button
                type="button"
                className="text-xs text-slate-500 hover:text-slate-700"
                onClick={() => setGradeModalId(null)}
              >
                Tutup
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {grades.map((grade) => {
                const checked = selectedGrades.includes(grade.id);
                return (
                  <label
                    key={grade.id}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${
                      checked
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="accent-emerald-600"
                      checked={checked}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setSelectedGrades((prev) => {
                          if (isChecked) {
                            return prev.includes(grade.id)
                              ? prev
                              : [...prev, grade.id];
                          }
                          return prev.filter((id) => id !== grade.id);
                        });
                      }}
                    />
                    {grade.name}
                  </label>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setGradeModalId(null)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleSaveGrades(gradeModalId)}
                disabled={selectedGrades.length === 0 || loadingId === gradeModalId}
                className="rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {loadingId === gradeModalId ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
