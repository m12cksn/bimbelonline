"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
        alert(`Gagal memuat kelas: ${serverMsg.toString().slice(0, 200)}`);
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
        alert(
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
      alert(
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

      alert("Kelas berhasil dibuat!");

      // reset form
      setForm({ subject: "", grade: "", description: "" });

      // reload classes
      fetchClasses();
    } catch (err) {
      console.error("handleCreate error:", err);
      alert((err as Error).message);
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
      <h1 className="text-2xl font-bold">Admin – Manage Classes</h1>

      {/* CREATE CLASS FORM */}
      <section className="mt-6 p-4 border rounded">
        <h2 className="font-semibold text-lg">Create New Class</h2>

        <input
          className="border p-2 rounded block mt-2"
          placeholder="Subject"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
        />

        <input
          className="border p-2 rounded block mt-2"
          placeholder="Grade (Number)"
          value={form.grade}
          onChange={(e) => setForm({ ...form, grade: e.target.value })}
        />

        <textarea
          className="border p-2 rounded block mt-2"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <button
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
          onClick={handleCreate}
        >
          Create Class
        </button>
      </section>

      {/* CLASS LIST */}
      <section className="mt-8">
        <h2 className="font-semibold text-lg">Classes</h2>

        {loading && <p>Loading...</p>}

        {classes.length === 0 && !loading && (
          <p className="text-gray-600 mt-2">Belum ada kelas.</p>
        )}

        <ul className="mt-4 space-y-3">
          {classes.map((cls) => (
            <li
              key={cls.id}
              className="p-4 border rounded bg-gray-50 dark:bg-gray-800"
            >
              <p className="font-bold text-lg">{cls.name}</p>
              <p>Subject: {cls.subject}</p>
              <p>Grade: {cls.grade ?? "-"}</p>

              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  className="px-3 py-1 bg-green-600 text-white rounded"
                  onClick={() =>
                    router.push(`/dashboard/admin/classes/${cls.id}/teachers`)
                  }
                >
                  Teachers
                </button>

                <button
                  className="px-3 py-1 bg-purple-600 text-white rounded"
                  onClick={() =>
                    router.push(`/dashboard/admin/classes/${cls.id}/students`)
                  }
                >
                  Students
                </button>

                {/* 🔥 TOMBOL BARU – KELOLA ZOOM */}
                <button
                  className="px-3 py-1 bg-indigo-600 text-white rounded"
                  onClick={() =>
                    router.push(`/dashboard/admin/classes/${cls.id}/zoom`)
                  }
                >
                  Zoom
                </button>

                {/* (opsional, tetap ada) */}
                <button
                  className="px-3 py-1 bg-blue-600 text-white rounded"
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
