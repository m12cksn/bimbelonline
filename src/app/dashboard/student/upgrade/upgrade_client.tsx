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
      <div className="mt-4 space-y-3 rounded-2xl border border-emerald-300/60 bg-white/80 p-4 text-sm text-emerald-800 shadow-[0_20px_60px_-45px_rgba(0,0,0,1)]">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-semibold">Paket belum tersedia</p>
          <p className="mt-1 text-xs text-emerald-700">
            Admin belum mengaktifkan paket langganan. Kamu masih bisa belajar
            dengan soal gratis sambil menunggu paket dibuka.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <a
            href="https://wa.me/6285726321786?text=Halo%20admin%2C%20paket%20langganan%20belum%20muncul.%20Bisa%20dibantu%3F"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-emerald-400/70 bg-emerald-500/15 px-3 py-2 font-semibold text-emerald-900 hover:bg-emerald-500/25"
          >
            Hubungi admin via WhatsApp
          </a>
          <a
            href="/dashboard/student"
            className="rounded-xl border border-emerald-300/60 bg-white px-3 py-2 font-semibold text-emerald-800 hover:border-emerald-400/70"
          >
            Kembali ke dashboard
          </a>
        </div>
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
      className="mt-4 space-y-4 rounded-2xl border border-emerald-300/60 bg-white/80 p-4 shadow-[0_20px_60px_-45px_rgba(0,0,0,1)] sm:p-5"
    >
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <p className="text-sm font-semibold text-emerald-900">
          Upgrade supaya belajar makin lancar
        </p>
        <ul className="mt-2 space-y-1 text-[11px] text-emerald-700">
          <li>- Soal premium terbuka lebih banyak</li>
          <li>- Dapat akses Zoom class sesuai paket</li>
          <li>- Progress dan skor lebih lengkap</li>
        </ul>
      </div>
      {/* Status akun */}
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/60 bg-white/90 px-3 py-1 text-[11px]">
        <span className="text-emerald-700">Status akun:</span>
        {isPremium ? (
          <span className="rounded-full border border-amber-300/80 bg-amber-200/60 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
            Premium aktif - semua soal terbuka
          </span>
        ) : hasPending ? (
          <span className="rounded-full border border-emerald-300/80 bg-emerald-100/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-900">
            Menunggu persetujuan admin
          </span>
        ) : (
          <span className="rounded-full border border-emerald-300/80 bg-emerald-100/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-900">
            Gratis - bisa upgrade
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
            className={`rounded-2xl border px-3 py-3 text-left text-xs transition ${
              selectedPlanId === plan.id
                ? "border-emerald-500/70 bg-emerald-500/10 text-emerald-900"
                : "border-emerald-300/60 bg-white/80 text-emerald-900 hover:border-emerald-400/70"
            } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide">
                {plan.name}
              </span>
              <span className="text-[11px] text-emerald-700">
                {plan.duration_days} hari
              </span>
            </div>
            <div className="mt-1 text-lg font-bold">
              Rp {plan.price_idr.toLocaleString("id-ID")}
            </div>
            {plan.description && (
              <p className="mt-1 text-[11px] text-emerald-700">
                {plan.description}
              </p>
            )}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-700">
          {errorMsg}
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-700">
          {message}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <button
          type="submit"
          disabled={disabled}
          className="w-full rounded-xl border border-emerald-500/70 bg-emerald-500/20 px-4 py-2 font-semibold text-emerald-900 shadow-md shadow-emerald-500/30 disabled:opacity-60 sm:w-auto"
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
          className="w-full rounded-xl border border-emerald-400/70 bg-emerald-500/10 px-3 py-2 font-semibold text-emerald-900 hover:bg-emerald-500/20 sm:w-auto"
        >
          Konfirmasi via WhatsApp
        </a>
      </div>
    </form>
  );
}
