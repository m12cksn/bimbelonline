"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/ToastProvider";

type Profile = { id: string; full_name?: string | null; email?: string | null };

export default function AddTeacherPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const { id: classId } = use(params as Promise<{ id: string }>);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    fetchProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchProfiles() {
    try {
      const res = await fetch(`/api/adm/profiles?role=teacher`, {
        credentials: "same-origin",
      });
      const text = await res.text();
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) {
        setProfiles([]);
        return;
      }
      const parsed = JSON.parse(text) as { ok?: boolean; profiles?: Profile[] };
      setProfiles(parsed.profiles ?? []);
    } catch (err) {
      console.error("fetchProfiles error", err);
      setProfiles([]);
    }
  }

  async function handleAdd() {
    if (!selected) {
      toast.error("Pilih teacher");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/adm/classes/${classId}/teachers`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher_id: selected }),
      });

      const text = await res.text();
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) {
        toast.error("Respons server tidak valid");
        return;
      }
      const json = JSON.parse(text) as { ok?: boolean; error?: string };

      if (!res.ok || !json.ok) {
        toast.error(
          "Gagal menambahkan teacher: " + (json.error ?? "Unknown error")
        );
        return;
      }

      toast.success("Teacher berhasil ditambahkan");
      router.push(`/dashboard/admin/classes/${classId}/teachers`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Gagal menambahkan teacher: " + msg);
      console.error("handleAdd error", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Add Teacher — Class {classId}</h1>
      <div className="mt-4">
        <select
          className="w-full p-2 border rounded"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">-- pilih teacher --</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name ?? p.email ?? p.id}
            </option>
          ))}
        </select>
        <div className="mt-4">
          <button
            onClick={handleAdd}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {loading ? "Adding..." : "Add Teacher to Class"}
          </button>
        </div>
      </div>
    </div>
  );
}
