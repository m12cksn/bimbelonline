// app/dashboard/teacher/components/TeacherNoteEditor.tsx
"use client";
import React, { useEffect, useState, startTransition } from "react";

type Note = {
  id: string;
  student_id?: string;
  material_id?: number;
  content: string;
  created_by?: { full_name?: string } | string | null;
  created_at?: string;
  updated_at?: string;
};

export default function TeacherNoteEditor({
  studentId,
  materialId,
}: {
  studentId: string;
  materialId: number;
}) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);

  useEffect(() => {
    // pattern: definisikan async di dalam effect, gunakan startTransition saat setState
    let mounted = true;

    async function load() {
      try {
        setLoadingNotes(true);
        const res = await fetch(
          `/api/teacher/notes?studentId=${encodeURIComponent(
            studentId
          )}&materialId=${encodeURIComponent(String(materialId))}`
        );
        const j = await res.json();
        const data: Note[] = Array.isArray(j.data) ? j.data : [];
        if (!mounted) return;
        // gunakan startTransition agar React tidak mengeluarkan peringatan cascading renders
        startTransition(() => {
          setNotes(data);
        });
      } catch (err) {
        console.error("Load notes error:", err);
      } finally {
        if (mounted) setLoadingNotes(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [studentId, materialId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/teacher/notes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          materialId,
          content: content.trim(),
        }),
      });
      const j = await res.json();
      if (res.ok && j.ok) {
        setContent("");
        // reload notes (best effort)
        startTransition(async () => {
          try {
            const r2 = await fetch(
              `/api/teacher/notes?studentId=${encodeURIComponent(
                studentId
              )}&materialId=${encodeURIComponent(String(materialId))}`
            );
            const j2 = await r2.json();
            const data: Note[] = Array.isArray(j2.data) ? j2.data : [];
            setNotes(data);
          } catch (err) {
            console.error("Reload notes after create failed:", err);
          }
        });
      } else {
        alert(j?.error || "Gagal membuat catatan");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal membuat catatan (network).");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-3 text-sm text-slate-50">
      <div className="mb-2 text-xs text-slate-300">Catatan Guru (privat)</div>

      <form onSubmit={handleCreate} className="mb-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tulis catatan singkat untuk murid ini terkait materi..."
          className="w-full rounded-md bg-slate-800 p-2 text-sm text-slate-100"
          rows={3}
        />
        <div className="mt-2 flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded px-3 py-1 bg-emerald-600/30 text-emerald-100"
          >
            {loading ? "Menyimpan..." : "Simpan Catatan"}
          </button>
          {loadingNotes && (
            <div className="text-xs text-slate-400 self-center">
              Memuat catatan...
            </div>
          )}
        </div>
      </form>

      <div className="space-y-2">
        {notes.length === 0 ? (
          <div className="text-xs text-slate-400">Belum ada catatan.</div>
        ) : (
          notes.map((n) => (
            <div
              key={n.id}
              className="rounded border border-slate-700 p-2 bg-slate-800/60"
            >
              <div className="text-xs text-slate-300 mb-1 whitespace-pre-line">
                {n.content}
              </div>
              <div className="text-[10px] text-slate-400">
                oleh{" "}
                {typeof n.created_by === "object"
                  ? n.created_by?.full_name ?? "Unknown"
                  : n.created_by ?? "Unknown"}{" "}
                • {n.created_at ? new Date(n.created_at).toLocaleString() : "-"}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
