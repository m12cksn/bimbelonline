// src/app/dashboard/admin/classes/[id]/zoom/page.tsx
"use client";

import { confirmAction } from "@/lib/alerts";
import { use, useCallback, useEffect, useState } from "react";
import { useToast } from "@/app/components/ToastProvider";

type ZoomSession = {
  id: number;
  title: string | null;
  start_time: string;
  end_time: string;
  zoom_link: string;
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminClassZoomPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const { id: classId } = use(params as Promise<{ id: string }>);

  const [sessions, setSessions] = useState<ZoomSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  // form state
  const [title, setTitle] = useState<string>("Sesi Zoom");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [zoomLink, setZoomLink] = useState<string>("");

  const fetchZoom = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/adm/classes/${classId}/zoom`, {
        credentials: "same-origin",
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Gagal memuat jadwal zoom");
        return;
      }

      setSessions(json.sessions ?? []);
    } catch (err) {
      console.error("fetch zoom", err);
      setError("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchZoom();
  }, [fetchZoom]);

  async function handleCreate() {
    if (!startTime || !endTime || !zoomLink) {
      toast.error("Tanggal & link zoom wajib diisi");
      return;
    }

    try {
      const res = await fetch(`/api/adm/classes/${classId}/zoom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          title,
          start_time: startTime,
          end_time: endTime,
          zoom_link: zoomLink,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "Gagal membuat jadwal zoom");
        return;
      }

      // reset form
      setTitle("Sesi Zoom");
      setStartTime("");
      setEndTime("");
      setZoomLink("");

      fetchZoom();
    } catch (err) {
      console.error("create zoom", err);
      toast.error("Terjadi kesalahan");
    }
  }

  async function handleDelete(zoomId: number) {
    const ok = await confirmAction({
      title: "Hapus jadwal",
      text: "Hapus jadwal zoom ini?",
      confirmText: "Hapus",
      cancelText: "Batal",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/adm/classes/${classId}/zoom/${zoomId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "Gagal menghapus jadwal");
        return;
      }

      fetchZoom();
    } catch (err) {
      console.error("delete zoom", err);
      toast.error("Terjadi kesalahan");
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Jadwal Zoom — Admin</h1>

      {/* FORM */}
      <div className="border rounded p-4 space-y-4">
        <h2 className="font-semibold">Tambah Jadwal Zoom</h2>

        <div>
          <label className="block text-sm mb-1">Judul</label>
          <input
            className="w-full border p-2 rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Mulai</label>
            <input
              type="datetime-local"
              className="w-full border p-2 rounded"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Selesai</label>
            <input
              type="datetime-local"
              className="w-full border p-2 rounded"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Zoom Link</label>
          <input
            className="w-full border p-2 rounded"
            placeholder="https://zoom.us/..."
            value={zoomLink}
            onChange={(e) => setZoomLink(e.target.value)}
          />
        </div>

        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Simpan Jadwal
        </button>
      </div>

      {/* LIST */}
      <div>
        <h2 className="font-semibold mb-2">Daftar Jadwal</h2>

        {sessions.length === 0 && (
          <div className="text-gray-500">
            Belum ada jadwal zoom untuk kelas ini
          </div>
        )}

        <div className="space-y-3">
          {sessions.map((z) => (
            <div
              key={z.id}
              className="border rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div>
                <div className="font-medium">{z.title}</div>
                <div className="text-sm text-gray-600">
                  {formatDateTime(z.start_time)} – {formatDateTime(z.end_time)}
                </div>
                <a
                  href={z.zoom_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-sm"
                >
                  {z.zoom_link}
                </a>
              </div>

              <button
                onClick={() => handleDelete(z.id)}
                className="px-3 py-1.5 bg-red-600 text-white rounded text-sm"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
