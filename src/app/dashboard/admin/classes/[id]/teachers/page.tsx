"use client";

import { use, useCallback, useEffect, useState } from "react";
import { confirmAction } from "@/lib/alerts";
import Link from "next/link";
import { useToast } from "@/app/components/ToastProvider";

type TeacherRow = {
  id: string;
  teacher_id: string;
  teacher_name: string;
  added_at?: string | null;
};

function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ClassTeachersPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const { id: classId } = use(params as Promise<{ id: string }>);

  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/adm/classes/${classId}/teachers-list`, {
        credentials: "same-origin",
      });
      const text = await res.text();
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) {
        setTeachers([]);
        return;
      }
      const parsed = JSON.parse(text) as {
        ok?: boolean;
        teachers?: TeacherRow[];
        error?: string;
      };
      setTeachers(parsed.teachers ?? []);
    } catch (err) {
      console.error("fetchTeachers", err);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  async function handleRemove(tid: string) {
    const ok = await confirmAction({
      title: "Hapus teacher",
      text: "Hapus teacher dari kelas?",
      confirmText: "Hapus",
      cancelText: "Batal",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/adm/classes/${classId}/teachers/${tid}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const text = await res.text();
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) {
        toast.error("Respons server tidak valid");
        return;
      }
      const json = JSON.parse(text) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        toast.error("Gagal menghapus teacher: " + (json.error ?? "Unknown"));
        return;
      }
      // refresh list
      fetchTeachers();
    } catch (err) {
      console.error("remove teacher", err);
      toast.error("Gagal menghapus teacher");
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Teachers — Class {classId}</h1>
        <Link
          href={`/dashboard/admin/classes/${classId}/add-teacher`}
          prefetch={false}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          + Add Teacher
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Teacher Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Added At
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {teachers.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-4 text-center text-gray-500">
                  Belum ada teacher di kelas ini
                </td>
              </tr>
            )}

            {teachers.map((t) => (
              <tr key={t.id} className="">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-200">
                    {t.teacher_name}
                  </div>
                </td>

                <td className="px-4 py-3 text-sm text-gray-300">
                  {formatDateShort(t.added_at)}
                </td>

                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleRemove(t.teacher_id)}
                    className="px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
