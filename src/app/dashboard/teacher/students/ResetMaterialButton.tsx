"use client";

import { useTransition, useState } from "react";
import { useToast } from "@/app/components/ToastProvider";
import { confirmAction } from "@/lib/alerts";

interface ResetMaterialButtonProps {
  studentId: string;
  materialId: number;
  materialTitle: string;
}

interface ResetResponse {
  success?: boolean;
  studentId?: string;
  materialId?: number;
  error?: string;
}

export default function ResetMaterialButton({
  studentId,
  materialId,
  materialTitle,
}: ResetMaterialButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  async function handleClick() {
    setError(null);

    const ok = await confirmAction({
      title: "Reset progres",
      text: `Reset semua progres materi "${materialTitle}" untuk murid ini?`,
      confirmText: "Reset",
      cancelText: "Batal",
    });
    if (!ok) return;

    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/teacher/students/${studentId}/materials/${materialId}/reset`,
          {
            method: "DELETE",
          }
        );

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          setError("Server tidak mengirim JSON (mungkin error internal).");
          return;
        }

        const data = (await res.json()) as ResetResponse;

        if (!res.ok) {
          setError(data.error || "Gagal mereset progres.");
          return;
        }

        toast.success("Progres berhasil direset. Halaman akan direfresh.");
        window.location.reload();
      } catch (e: unknown) {
        console.error(e);
        setError("Terjadi error jaringan saat mereset progres.");
      }
    });
  }

  return (
    <div className="mt-3 flex flex-col items-start gap-1 text-[10px]">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-xl border border-red-400/70 bg-red-500/20 px-3 py-1.5 font-semibold text-red-200 hover:bg-red-500/40 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Mereset..." : "🔁 Reset progres materi ini"}
      </button>
      {error && <div className="text-red-300">{error}</div>}
    </div>
  );
}
