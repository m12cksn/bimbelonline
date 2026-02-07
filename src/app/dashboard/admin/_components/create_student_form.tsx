"use client";

import { useState } from "react";
import { useToast } from "@/app/components/ToastProvider";

export default function CreateStudentForm() {
  const toast = useToast();
  const [fullName, setFullName] = useState("");
  const [learningTrack, setLearningTrack] = useState<"math" | "coding">(
    "math"
  );
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{
    username: string;
    password: string;
    email: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/adm/students/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          learningTrack,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Gagal membuat akun siswa");
      }

      toast.success("Akun siswa berhasil dibuat.");
      setFullName("");
      setLearningTrack("math");
      setCreated(data.user ?? null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Nama siswa
          </label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            placeholder="Nama lengkap siswa"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Kelas
          </label>
          <select
            value={learningTrack}
            onChange={(e) =>
              setLearningTrack(e.target.value as "math" | "coding")
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="math">Matematika</option>
            <option value="coding">Coding</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl border border-emerald-600 bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-60"
      >
        {loading ? "Membuat akun..." : "Buat akun siswa"}
      </button>

      {created ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-emerald-800">
                Akun siswa berhasil dibuat
              </p>
              <p className="text-[11px] text-emerald-700">
                Kirimkan data berikut ke siswa.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                navigator.clipboard.writeText(
                  `Username: ${created.username}\nPassword: ${created.password}`
                )
              }
              className="rounded-xl border border-emerald-300 bg-white px-3 py-2 text-[11px] font-semibold text-emerald-700"
            >
              Salin username & password
            </button>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-white px-3 py-2">
              <div className="text-[10px] uppercase text-emerald-600">
                Username
              </div>
              <div className="font-semibold text-slate-900">
                {created.username}
              </div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-white px-3 py-2">
              <div className="text-[10px] uppercase text-emerald-600">
                Password
              </div>
              <div className="font-semibold text-slate-900">
                {created.password}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <p className="text-[11px] text-slate-500">
        Username & password akan digenerate otomatis.
      </p>
    </form>
  );
}
