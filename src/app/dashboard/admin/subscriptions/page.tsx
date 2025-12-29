"use client";

import { useEffect, useMemo, useState } from "react";

type StudentRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  subscription: {
    id: string;
    status: string | null;
    start_at: string | null;
    end_at: string | null;
    plan_name: string | null;
  } | null;
  quota: {
    allowed_sessions: number;
    used_sessions: number;
    remaining_sessions: number;
  };
  remaining_days: number | null;
};

type ApiListResponse = {
  ok?: boolean;
  students?: StudentRow[];
  error?: string;
};

type ApiResponse = {
  ok?: boolean;
  updated?: number;
  error?: string;
  message?: string;
};

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDaysLeft(days: number | null) {
  if (days === null) return "-";
  if (days <= 0) return "0 hari";
  return `${days} hari`;
}

export default function AdminSubscriptionsPage() {
  const [items, setItems] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expiryFilter, setExpiryFilter] = useState("all");
  const [quotaInputs, setQuotaInputs] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

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
        return;
      }

      const json: ApiListResponse = JSON.parse(text);

      if (!json.ok) {
        setMessage(json.error ?? "Gagal mengambil data student");
        setItems([]);
        return;
      }

      setItems(json.students ?? []);
    } catch (err) {
      console.error("fetch student list error:", err);
      setMessage("Gagal mengambil data. Cek console.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddQuota(studentId: string) {
    const raw = quotaInputs[studentId] ?? "";
    const amount = Number(raw);
    if (!amount || amount <= 0) {
      setMessage("Jumlah kuota harus lebih dari 0.");
      return;
    }

    setSubmitting(studentId);
    setMessage(null);

    try {
      const res = await fetch("/api/adm/students/add-quota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          student_id: studentId,
          add_sessions: amount,
        }),
      });

      const text = await res.text();
      const ct = res.headers.get("content-type") ?? "";
      const json: ApiResponse = ct.includes("application/json")
        ? JSON.parse(text)
        : { ok: false, error: "Non-JSON response" };

      if (!res.ok || !json.ok) {
        setMessage(json.error ?? "Gagal menambahkan kuota");
        return;
      }

      setMessage(json.message ?? "Kuota berhasil ditambahkan.");
      setQuotaInputs((prev) => ({ ...prev, [studentId]: "" }));
      fetchList();
    } catch (err) {
      console.error("add quota error:", err);
      setMessage("Terjadi kesalahan saat menambah kuota.");
    } finally {
      setSubmitting(null);
    }
  }

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();

    return items.filter((item) => {
      const name = item.full_name?.toLowerCase() ?? "";
      const email = item.email?.toLowerCase() ?? "";
      const status = (item.subscription?.status ?? "none").toLowerCase();
      const remainingDays = item.remaining_days;

      if (term && !name.includes(term) && !email.includes(term)) {
        return false;
      }

      if (statusFilter !== "all" && status !== statusFilter) {
        return false;
      }

      if (expiryFilter !== "all") {
        const maxDays = Number(expiryFilter);
        if (remainingDays === null) return false;
        if (Number.isNaN(maxDays) || remainingDays > maxDays) return false;
      }

      return true;
    });
  }, [items, search, statusFilter, expiryFilter]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Student Subscriptions</h1>
        <button
          type="button"
          onClick={fetchList}
          className="rounded-xl bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-700"
        >
          Refresh
        </button>
      </div>

      {message && (
        <div className="rounded border border-amber-400/40 bg-amber-100/10 px-4 py-3 text-sm text-amber-50">
          {message}
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-xs">
        <input
          className="min-w-[220px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
          placeholder="Cari nama / email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Semua status</option>
          <option value="active">Aktif</option>
          <option value="expired">Expired</option>
          <option value="pending">Pending</option>
          <option value="none">Belum ada subscription</option>
        </select>

        <select
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
          value={expiryFilter}
          onChange={(e) => setExpiryFilter(e.target.value)}
        >
          <option value="all">Semua masa berlaku</option>
          <option value="7">Sisa &lt;= 7 hari</option>
          <option value="3">Sisa &lt;= 3 hari</option>
          <option value="1">Sisa &lt;= 1 hari</option>
        </select>
      </div>

      <div className="mt-4">
        {loading && <div>Memuat data student...</div>}

        {!loading && filteredItems.length === 0 && (
          <div className="text-sm text-slate-600">
            Tidak ada student yang cocok.
          </div>
        )}

        <ul className="mt-4 space-y-4">
          {filteredItems.map((s) => {
            const status = (s.subscription?.status ?? "none").toLowerCase();
            const remaining = s.quota.remaining_sessions ?? 0;

            const statusColor =
              status === "active"
                ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/40"
                : status === "expired"
                ? "bg-rose-500/15 text-rose-200 border-rose-400/40"
                : status === "pending"
                ? "bg-amber-500/20 text-amber-200 border-amber-400/40"
                : "bg-slate-500/20 text-slate-700 border-slate-400/40";

            return (
              <li
                key={s.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700 md:flex-row md:items-center md:justify-between md:px-6"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold">
                      {s.full_name ?? "Tanpa nama"}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${statusColor}`}
                    >
                      {status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">
                    {s.email ?? "Tanpa email"}
                  </p>

                  <p className="mt-1 text-xs text-slate-600/90">
                    Paket:{" "}
                    <span className="font-medium text-slate-50">
                      {s.subscription?.plan_name ?? "-"}
                    </span>
                  </p>

                  <p className="text-xs text-slate-500">
                    Periode:{" "}
                    <span className="font-medium">
                      {formatDate(s.subscription?.start_at)} -{" "}
                      {formatDate(s.subscription?.end_at)}
                    </span>
                  </p>

                  <p className="text-xs text-slate-600">
                    Sisa kuota:{" "}
                    <span className="font-semibold text-emerald-200">
                      {remaining}
                    </span>{" "}
                    (dari {s.quota.allowed_sessions})
                  </p>

                  <p className="text-xs text-slate-500">
                    Sisa masa berlaku:{" "}
                    <span className="font-medium">
                      {formatDaysLeft(s.remaining_days)}
                    </span>
                  </p>

                  <p className="text-[11px] text-slate-500 mt-1">
                    Student ID: {s.id}
                  </p>
                </div>

                <div className="flex flex-col gap-2 md:items-end">
                  <div className="flex items-center gap-2">
                    <input
                      className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900"
                      placeholder="+ kuota"
                      value={quotaInputs[s.id] ?? ""}
                      onChange={(e) =>
                        setQuotaInputs((prev) => ({
                          ...prev,
                          [s.id]: e.target.value,
                        }))
                      }
                    />
                    <button
                      onClick={() => handleAddQuota(s.id)}
                      disabled={submitting === s.id}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow disabled:opacity-50"
                    >
                      {submitting === s.id ? "Menambah..." : "Tambah kuota"}
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Kuota ditambahkan ke semua kelas student.
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
