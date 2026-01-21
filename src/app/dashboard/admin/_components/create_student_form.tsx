"use client";

import { useState } from "react";
import { useToast } from "@/app/components/ToastProvider";

export default function CreateStudentForm() {
  const toast = useToast();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [learningTrack, setLearningTrack] = useState<"math" | "coding">(
    "math"
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/adm/students/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          fullName,
          learningTrack,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Gagal membuat akun siswa");
      }

      toast.success("Akun siswa berhasil dibuat.");
      setUsername("");
      setEmail("");
      setPassword("");
      setFullName("");
      setLearningTrack("math");
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
            Username
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            required
            placeholder="contoh: budi123"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            required
            placeholder="nama@gmail.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Password
          </label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            required
            minLength={6}
            placeholder="minimal 6 karakter"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Nama lengkap (opsional)
          </label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            placeholder="Nama siswa"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Track belajar
          </label>
          <select
            value={learningTrack}
            onChange={(e) =>
              setLearningTrack(e.target.value as "math" | "coding")
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
          >
            <option value="math">Math</option>
            <option value="coding">Coding</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-4 rounded-xl border border-emerald-600 bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "Membuat akun..." : "Buat akun siswa"}
        </button>
      </div>

      <p className="text-[11px] text-slate-500">
        Admin akan mengirim username & password ke siswa via WhatsApp.
      </p>
    </form>
  );
}
