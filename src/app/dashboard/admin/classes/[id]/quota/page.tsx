// src/app/dashboard/admin/classes/[id]/quota/page.tsx

"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";

type QuotaRow = {
  student_id: string;
  name: string;
  email: string | null;
  subscription_id: string | null;
  start_date: string | null;
  end_date: string | null;
  quota: {
    allowed: number;
    used: number;
    remaining: number;
    period_start: string | null;
    period_end: string | null;
  } | null;
};

type ApiResponse = {
  ok?: boolean;
  class_id?: number;
  students?: QuotaRow[];
  error?: string;
};

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminClassQuotaPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const { id: classId } = use(params as Promise<{ id: string }>);

  const [rows, setRows] = useState<QuotaRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/adm/classes/${classId}/quota`, {
        credentials: "same-origin",
      });
      const json = (await res.json()) as ApiResponse;
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Gagal memuat rekap kuota");
        setRows([]);
        return;
      }
      setRows(json.students ?? []);
    } catch (err) {
      console.error("load quota", err);
      setError("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    const allowed = rows.reduce((sum, r) => sum + (r.quota?.allowed ?? 0), 0);
    const used = rows.reduce((sum, r) => sum + (r.quota?.used ?? 0), 0);
    return { allowed, used, remaining: allowed - used };
  }, [rows]);

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-500">Class ID #{classId}</p>
          <h1 className="text-2xl font-bold">Rekap Kuota Zoom</h1>
          <p className="text-gray-600">
            Lihat ringkasan kuota per siswa untuk kelas ini.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700 disabled:opacity-60"
          onClick={load}
          disabled={loading}
        >
          {loading ? "Memuat..." : "Muat ulang"}
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Total Siswa</div>
          <div className="text-2xl font-bold">{rows.length}</div>
        </div>
        <div className="rounded border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Kuota Terpakai</div>
          <div className="text-2xl font-bold text-amber-700">{totals.used}</div>
        </div>
        <div className="rounded border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Sisa Kuota</div>
          <div className="text-2xl font-bold text-emerald-700">
            {totals.remaining}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      {!error && rows.length === 0 && !loading && (
        <div className="rounded border bg-white p-4 text-gray-600 shadow-sm">
          Tidak ada data kuota untuk kelas ini.
        </div>
      )}

      <section className="overflow-x-auto rounded border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-700">Siswa</th>
              <th className="px-4 py-3 font-semibold text-gray-700">Email</th>
              <th className="px-4 py-3 font-semibold text-gray-700">Periode</th>
              <th className="px-4 py-3 font-semibold text-gray-700">Kuota</th>
              <th className="px-4 py-3 font-semibold text-gray-700">Sisa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-3 text-center text-gray-500">
                  Memuat data...
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((r) => {
                const quotaText = r.quota
                  ? `${r.quota.used} / ${r.quota.allowed}`
                  : "-";
                const remaining = r.quota?.remaining ?? 0;
                return (
                  <tr key={`${r.student_id}-${r.subscription_id ?? "none"}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {r.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.email ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(r.quota?.period_start ?? r.start_date)}
                      {" – "}
                      {formatDate(r.quota?.period_end ?? r.end_date)}
                    </td>
                    <td className="px-4 py-3 text-gray-800">{quotaText}</td>
                    <td className="px-4 py-3 text-gray-800">{remaining}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
