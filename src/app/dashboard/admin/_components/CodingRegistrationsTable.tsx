"use client";

import { useMemo, useState } from "react";
import { useToast } from "@/app/components/ToastProvider";

type CodingRegistrationRow = {
  id: string;
  full_name: string;
  phone: string;
  package_name: string;
  package_code: string;
  total_sessions: number;
  price_idr: number;
  status: string;
  notes: string | null;
  payment_status: string | null;
  payment_proof_url: string | null;
  paid_at: string | null;
  created_at: string;
};

type Props = {
  rows: CodingRegistrationRow[];
};

function formatIdr(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CodingRegistrationsTable({ rows }: Props) {
  const toast = useToast();
  const [items, setItems] = useState(rows);
  const [statusFilter, setStatusFilter] = useState("all");
  const [workingId, setWorkingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return items;
    return items.filter((row) => row.status === statusFilter);
  }, [items, statusFilter]);

  async function updateStatus(id: string, action: "approve" | "decline") {
    setWorkingId(id);
    try {
      const res = await fetch(
        `/api/adm/coding-registrations/${id}/${action}`,
        { method: "POST" }
      );
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal memperbarui status.");
      }
      if (action === "approve" && json.wa_link) {
        window.open(json.wa_link as string, "_blank", "noopener,noreferrer");
      }
      setItems((prev) =>
        prev.map((row) =>
          row.id === id
            ? { ...row, status: action === "approve" ? "approved" : "declined" }
            : row
        )
      );
      toast.success(
        action === "approve"
          ? "Pendaftaran disetujui."
          : "Pendaftaran ditolak."
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setWorkingId(null);
    }
  }

  const statusBadge = (status: string) => {
    if (status === "approved") {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }
    if (status === "declined") {
      return "border-rose-200 bg-rose-50 text-rose-700";
    }
    return "border-amber-200 bg-amber-50 text-amber-700";
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span>Filter status:</span>
          <select
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Semua</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="declined">Declined</option>
          </select>
        </div>
        <span>Total: {filtered.length}</span>
      </div>

      <div className="overflow-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-xs text-slate-700">
          <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Siswa</th>
              <th className="px-4 py-3 text-left">Paket</th>
              <th className="px-4 py-3 text-left">Harga</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Pembayaran</th>
              <th className="px-4 py-3 text-left">Dikirim</th>
              <th className="px-4 py-3 text-left">Catatan</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-t border-slate-200">
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900">
                    {row.full_name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {row.phone}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900">
                    {row.package_name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {row.total_sessions} kelas
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold text-slate-900">
                  Rp {formatIdr(row.price_idr)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusBadge(
                      row.status
                    )}`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-[11px] text-slate-600">
                  <div className="font-semibold text-slate-700">
                    {row.payment_status ?? "unpaid"}
                  </div>
                  {row.paid_at ? (
                    <div className="text-[10px] text-slate-500">
                      {formatDate(row.paid_at)} • {formatTime(row.paid_at)}
                    </div>
                  ) : null}
                  {row.payment_proof_url ? (
                    <a
                      href={row.payment_proof_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
                    >
                      Lihat bukti
                    </a>
                  ) : (
                    <div className="mt-1 text-[10px] text-slate-400">
                      Belum ada bukti
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-[11px] text-slate-500">
                  {formatDate(row.created_at)}
                </td>
                <td className="px-4 py-3 text-[11px] text-slate-500">
                  {row.notes ?? "-"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {row.status === "approved" ? (
                      <button
                        type="button"
                        disabled={workingId === row.id}
                        onClick={() => updateStatus(row.id, "approve")}
                        className="rounded-lg border border-emerald-600 bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-700 disabled:opacity-60"
                      >
                        Kirim WA
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={workingId === row.id}
                        onClick={() => updateStatus(row.id, "approve")}
                        className="rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-60"
                      >
                        Approve + WA
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={workingId === row.id}
                      onClick={() => updateStatus(row.id, "decline")}
                      className="rounded-lg border border-rose-600 bg-rose-600 px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-60"
                    >
                      Decline
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-6 text-center text-xs text-slate-500"
                >
                  Belum ada pendaftar coding.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
