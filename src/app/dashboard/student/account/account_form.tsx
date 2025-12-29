"use client";

import { useState } from "react";
import { useToast } from "@/app/components/ToastProvider";

type AccountFormProps = {
  initialFullName: string;
  initialPhone: string;
  email: string;
  role: string;
};

export default function AccountForm({
  initialFullName,
  initialPhone,
  email,
  role,
}: AccountFormProps) {
  const toast = useToast();
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [saving, setSaving] = useState(false);

  function formatPhone(value: string) {
    const digits = value.replace(/[^0-9]/g, "");
    if (!digits) return "";
    if (digits.startsWith("62")) return `+${digits}`;
    if (digits.startsWith("0")) return `+62${digits.slice(1)}`;
    if (digits.startsWith("8")) return `+62${digits}`;
    return value;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Nama lengkap tidak boleh kosong.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/student/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim(), phone: phone.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal menyimpan profil.");
      }
      toast.success("Profil berhasil diperbarui.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Informasi Profil
        </h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <label
              className="text-[11px] font-semibold text-slate-500"
              htmlFor="student-full-name"
            >
              Nama lengkap
            </label>
            <input
              id="student-full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
              placeholder="Masukkan nama lengkap"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500">
              Role
            </label>
            <input
              value={role}
              readOnly
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-[11px] font-semibold text-slate-500">
              Nama tampilan publik
            </label>
            <input
              value={fullName || email}
              readOnly
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Kontak
        </h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-[11px] font-semibold text-slate-500">
              Email
            </label>
            <input
              value={email}
              readOnly
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </div>
          <div>
            <label
              className="text-[11px] font-semibold text-slate-500"
              htmlFor="student-phone"
            >
              WhatsApp / Nomor HP
            </label>
            <input
              id="student-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={(e) => setPhone(formatPhone(e.target.value))}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
              placeholder="08xx atau +62xx"
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl border border-emerald-200 bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-emerald-600 disabled:opacity-60"
        >
          {saving ? "Menyimpan..." : "Simpan perubahan"}
        </button>
        <span className="text-[11px] text-slate-500">
          Perubahan akan langsung tersimpan di profil kamu.
        </span>
      </div>
    </form>
  );
}
