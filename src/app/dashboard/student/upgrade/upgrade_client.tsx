"use client";

import { useState } from "react";

type PlanRow = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  price_idr: number;
  duration_days: number;
};

type UpgradeClientProps = {
  plans: PlanRow[];
  initialIsPremium: boolean;
  initialHasPending: boolean;
};

type PaymentResponse = {
  success?: boolean;
  error?: string;
  code?: string;
};

export default function UpgradeClient({
  plans,
  initialIsPremium,
  initialHasPending,
}: UpgradeClientProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    plans[0]?.id ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState<boolean>(initialIsPremium);
  const [hasPending, setHasPending] = useState<boolean>(initialHasPending);

  if (!plans || plans.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-100">
        Belum ada paket langganan yang aktif. Silakan hubungi admin.
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setErrorMsg(null);

    if (isPremium) {
      setErrorMsg(
        "Akun kamu sudah Premium. Tidak perlu kirim permintaan lagi."
      );
      return;
    }

    if (hasPending) {
      setErrorMsg(
        "Permintaan upgrade sudah dikirim. Silakan tunggu admin memberi respon ya."
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/student/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlanId }),
      });

      let data: PaymentResponse = {};
      try {
        data = (await res.json()) as PaymentResponse;
      } catch {
        // ignore
      }

      if (!res.ok) {
        if (data.code === "PENDING_EXISTS") {
          setHasPending(true);
          setErrorMsg(
            "Permintaan upgrade sudah dikirim. Silakan tunggu admin memberi respon ya."
          );
        } else if (data.code === "ALREADY_PREMIUM") {
          setIsPremium(true);
          setErrorMsg("Akun kamu sudah Premium. Tidak perlu upgrade lagi.");
        } else {
          setErrorMsg(
            data.error || "Terjadi kesalahan saat membuat permintaan."
          );
        }
        return;
      }

      setHasPending(true);
      setMessage(
        "Permintaan upgrade berhasil dikirim. Admin akan memproses dalam 1×24 jam. Kamu juga bisa konfirmasi lewat WhatsApp."
      );
    } catch (err) {
      console.error(err);
      setErrorMsg("Ups, terjadi error jaringan.");
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading || isPremium || hasPending;

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-4 rounded-2xl border border-slate-700 bg-slate-900/80 p-4"
    >
      {/* Status akun */}
      <div className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[11px] inline-flex items-center gap-2">
        <span className="text-slate-400">Status akun:</span>
        {isPremium ? (
          <span className="font-semibold text-amber-300">
            Premium ⭐ Semua soal terbuka
          </span>
        ) : hasPending ? (
          <span className="font-semibold text-cyan-300">
            Menunggu persetujuan admin ⏳
          </span>
        ) : (
          <span className="font-semibold text-emerald-300">
            Gratis 🎁 (bisa upgrade)
          </span>
        )}
      </div>

      {/* List paket */}
      <div className="grid gap-3 md:grid-cols-2">
        {plans.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => setSelectedPlanId(plan.id)}
            disabled={disabled}
            className={`text-left rounded-2xl border px-3 py-3 text-xs transition ${
              selectedPlanId === plan.id
                ? "border-amber-400 bg-amber-500/15 text-amber-50"
                : "border-slate-700 bg-slate-900/80 text-slate-100 hover:border-cyan-400 hover:bg-slate-800"
            } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide">
                {plan.name}
              </span>
              <span className="text-[11px] text-slate-300">
                {plan.duration_days} hari
              </span>
            </div>
            <div className="mt-1 text-lg font-bold">
              Rp {plan.price_idr.toLocaleString("id-ID")}
            </div>
            {plan.description && (
              <p className="mt-1 text-[11px] text-slate-300">
                {plan.description}
              </p>
            )}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-100">
          {errorMsg}
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-100">
          {message}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <button
          type="submit"
          disabled={disabled}
          className="rounded-xl border border-amber-400/70 bg-amber-500/30 px-4 py-2 font-semibold text-amber-50 shadow-md shadow-amber-500/40 disabled:opacity-60"
        >
          {isPremium
            ? "Sudah Premium"
            : hasPending
            ? "Permintaan sudah dikirim"
            : loading
            ? "Mengirim..."
            : "Kirim permintaan upgrade"}
        </button>

        <a
          href="https://wa.me/6285726321786?text=Halo%20saya%20mau%20konfirmasi%20upgrade%20paket%20premium%20MathKids"
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-emerald-400/70 bg-emerald-500/20 px-3 py-2 font-semibold text-emerald-100 hover:bg-emerald-500/40"
        >
          Konfirmasi via WhatsApp
        </a>
      </div>
    </form>
  );
}
