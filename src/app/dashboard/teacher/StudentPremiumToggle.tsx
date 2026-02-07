"use client";

import { useState, useTransition } from "react";

interface StudentPremiumToggleProps {
  studentId: string;
  initialIsPremium: boolean;
  studentName: string;
  showStatus?: boolean;
}

interface PremiumToggleResponse {
  success?: boolean;
  studentId?: string;
  full_name?: string | null;
  is_premium?: boolean;
  error?: string;
}

export default function StudentPremiumToggle({
  studentId,
  initialIsPremium,
  studentName,
  showStatus = true,
}: StudentPremiumToggleProps) {
  const [isPending, startTransition] = useTransition();
  const [isPremium, setIsPremium] = useState<boolean>(initialIsPremium);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setError(null);

    const targetValue = !isPremium;

    // konfirmasi kalau mau turunkan ke gratis
    if (isPremium && !targetValue) {
      const ok = window.confirm(
        `Turunkan ${studentName || "murid"} dari Premium ke Gratis?`
      );
      if (!ok) return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/teacher/premium-toggle", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentId,
            isPremium: targetValue,
          }),
        });

        const contentType = res.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          setError("Server tidak mengirim JSON (mungkin error internal).");
          return;
        }

        const data = (await res.json()) as PremiumToggleResponse;

        if (!res.ok) {
          console.error("Toggle premium error:", data);
          setError(data.error || "Gagal mengubah status premium.");
          return;
        }

        setIsPremium(data.is_premium === true);
      } catch (e: unknown) {
        console.error(e);
        setError("Terjadi error jaringan saat mengubah status premium.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1 text-[10px]">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className={`rounded-xl px-3 py-1.5 font-semibold shadow-sm transition ${
          isPremium
            ? "border border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700"
            : "border border-amber-400/70 bg-amber-200 text-slate-900 shadow-amber-500/40 hover:bg-amber-300"
        } disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {isPending
          ? "Menyimpan..."
          : isPremium
          ? "Turunkan ke Gratis"
          : "Upgrade ke Premium"}
      </button>
      {showStatus && (
        <div className="text-slate-400">
          Status:{" "}
          {isPremium ? (
            <span className="font-semibold text-amber-300">Premium ⭐</span>
          ) : (
            <span className="font-semibold text-emerald-300">Gratis 🎁</span>
          )}
        </div>
      )}
      {error && (
        <div className="text-[10px] text-red-300 max-w-[180px]">{error}</div>
      )}
    </div>
  );
}
