"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/ToastProvider";

/* ================================
   TYPE DEFINITIONS
   ================================ */

interface ClassRow {
  id: number;
  name: string;
  subject: string;
  grade: number | null;
  description?: string | null;
  is_active?: boolean;
  created_at?: string | null;
}

interface GetClassesResponse {
  classes: ClassRow[];
  error?: string;
}

/* ================================
   PAGE COMPONENT
   ================================ */

export default function AdminClassesPage() {
  const router = useRouter();
  const toast = useToast();

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    grade: "",
    description: "",
  });

  /* ================================
     FETCH CLASSES
     ================================ */

  async function fetchClasses() {
    setLoading(true);
    try {
      const res = await fetch("/api/adm/classes", {
        method: "GET",
        credentials: "same-origin",
      });

      const text = await res.text();
      const contentType = res.headers.get("content-type") ?? "";

      console.log("GET /api/adm/classes →", res.status, contentType);
      console.log(
        "GET /api/adm/classes body (first 1000 chars):",
        text.slice(0, 1000)
      );

      // jika server merespon non-OK, tampilkan pesan user-friendly tapi jangan crash
      if (!res.ok) {
        // coba parse JSON error kalau ada
        let serverMsg = text;
        if (contentType.includes("application/json")) {
          try {
            const parsed = JSON.parse(text) as {
              error?: string;
              message?: string;
            };
            serverMsg = parsed.error ?? parsed.message ?? text;
          } catch {
            // biarkan serverMsg = text
          }
        }
        // tampilkan pesan singkat ke user dan simpan log lengkap di console
        toast.error(
          `Gagal memuat kelas: ${serverMsg.toString().slice(0, 200)}`
        );
        setClasses([]);
        return;
      }

      // kalau body kosong — anggap tidak ada kelas
      if (!text || text.trim().length === 0) {
        setClasses([]);
        return;
      }

      // jika bukan JSON — log & tampilkan
      if (!contentType.includes("application/json")) {
        console.error("Response bukan JSON:", text.slice(0, 1000));
        toast.error(
          "Respons dari server bukan format JSON. Cek console untuk detail."
        );
        setClasses([]);
        return;
      }

      // parse JSON aman
      const json = JSON.parse(text) as GetClassesResponse;
      setClasses(json.classes ?? []);
    } catch (err) {
      console.error("fetchClasses unexpected error:", err);
      toast.error(
        "Terjadi kesalahan saat mengambil data kelas. Cek console untuk detail."
      );
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }

  /* ================================
     CREATE CLASS
     ================================ */

  async function handleCreate() {
    try {
      const payload = {
        subject: form.subject.trim(),
        grade: form.grade ? Number(form.grade) : null,
        description: form.description.trim(),
      };

      const res = await fetch("/api/adm/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const contentType = res.headers.get("content-type") ?? "";

      if (!contentType.includes("application/json")) {
        console.error("Response bukan JSON:", text);
        throw new Error("Response bukan JSON (lihat console)");
      }

      const json = JSON.parse(text) as { ok?: boolean; error?: string };

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Gagal membuat kelas");
      }

      toast.success("Kelas berhasil dibuat!");

      // reset form
      setForm({ subject: "", grade: "", description: "" });

      // reload classes
      fetchClasses();
    } catch (err) {
      console.error("handleCreate error:", err);
      toast.error((err as Error).message);
    }
  }

  /* ================================
     LOAD ONCE
     ================================ */

  useEffect(() => {
    fetchClasses();
  }, []);

  /* ================================
     RENDER
     ================================ */

  return (
    <div className="p-6">
      <div className="rounded-lg border border-emerald-200 bg-white p-5 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.25)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-600">
              Admin
            </p>
            <h1 className="text-2xl font-bold text-slate-900">Kelola Kelas</h1>
          </div>
        </div>
      </div>

      {/* CREATE CLASS FORM */}
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.2)]">
        <h2 className="text-lg font-semibold text-slate-900">
          Buat Kelas Baru
        </h2>

        <input
          className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
          placeholder="Subject"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
        />

        <input
          className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
          placeholder="Grade (Number)"
          value={form.grade}
          onChange={(e) => setForm({ ...form, grade: e.target.value })}
        />

        <textarea
          className="mt-3 min-h-[100px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <button
          className="mt-4 rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-700"
          onClick={handleCreate}
        >
          Buat Kelas
        </button>
      </section>

      {/* CLASS LIST */}
      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.2)]">
        <h2 className="text-lg font-semibold text-slate-900">Daftar Kelas</h2>

        {loading && <p className="mt-2 text-sm text-slate-500">Loading...</p>}

        {classes.length === 0 && !loading && (
          <p className="mt-2 text-sm text-slate-500">Belum ada kelas.</p>
        )}

        <ul className="mt-4 space-y-3">
          {classes.map((cls) => (
            <li
              key={cls.id}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-700"
            >
              <p className="text-lg font-semibold text-slate-900">{cls.name}</p>
              <p className="text-sm text-slate-600">Subject: {cls.subject}</p>
              <p className="text-sm text-slate-600">
                Grade: {cls.grade ?? "-"}
              </p>

              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  className="rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-emerald-700"
                  onClick={() =>
                    router.push(`/dashboard/admin/classes/${cls.id}/teachers`)
                  }
                >
                  Teachers
                </button>

                <button
                  className="rounded-lg border border-cyan-600 bg-cyan-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-cyan-700"
                  onClick={() =>
                    router.push(`/dashboard/admin/classes/${cls.id}/students`)
                  }
                >
                  Students
                </button>

                {/* ?? TOMBOL BARU - KELOLA ZOOM */}
                <button
                  className="rounded-lg border border-indigo-600 bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-indigo-700"
                  onClick={() =>
                    router.push(`/dashboard/admin/classes/${cls.id}/zoom`)
                  }
                >
                  Zoom
                </button>

                <button
                  className="rounded-lg border border-amber-500 bg-amber-500 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-amber-600"
                  onClick={() =>
                    router.push(`/dashboard/admin/classes/${cls.id}/quota`)
                  }
                >
                  Rekap Kuota
                </button>

                {/* (opsional, tetap ada) */}
                <button
                  className="rounded-lg border border-slate-400 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
                  onClick={() => router.push(`/dashboard/admin/subscriptions`)}
                >
                  Generate Quota
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
