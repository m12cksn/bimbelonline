"use client";
/* eslint-disable @next/next/no-img-element */

import { ChangeEvent, useEffect, useState } from "react";
import { useToast } from "@/app/components/ToastProvider";
import type { GradeCard } from "@/lib/gradeCards";

type ApiResponse = {
  ok: boolean;
  cards?: GradeCard[];
  error?: string;
  setupRequired?: boolean;
};

export default function GradeCardsClient() {
  const toast = useToast();
  const [cards, setCards] = useState<GradeCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingLevel, setSavingLevel] = useState<number | null>(null);
  const [uploadingLevel, setUploadingLevel] = useState<number | null>(null);
  const [setupRequired, setSetupRequired] = useState(false);

  async function loadCards() {
    setLoading(true);
    try {
      const response = await fetch("/api/adm/grade-cards", {
        credentials: "same-origin",
      });
      const data = (await response.json()) as ApiResponse;
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Gagal memuat kartu kelas");
      }
      setCards(data.cards ?? []);
      setSetupRequired(Boolean(data.setupRequired));
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCards();
  }, []);

  function updateCard(level: number, patch: Partial<GradeCard>) {
    setCards((current) =>
      current.map((card) =>
        card.level === level ? { ...card, ...patch } : card,
      ),
    );
  }

  async function uploadImage(
    level: number,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingLevel(level);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("level", String(level));

      const response = await fetch("/api/adm/grade-cards/upload", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as {
        ok?: boolean;
        url?: string;
        error?: string;
      };
      if (!response.ok || !data.ok || !data.url) {
        throw new Error(data.error ?? "Gagal mengunggah gambar");
      }
      updateCard(level, { imageUrl: data.url });
      toast.success("Gambar berhasil diunggah. Klik Simpan untuk menerapkan.");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setUploadingLevel(null);
      event.target.value = "";
    }
  }

  async function saveCard(card: GradeCard) {
    setSavingLevel(card.level);
    try {
      const response = await fetch("/api/adm/grade-cards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          level: card.level,
          name: card.name,
          description: card.description,
          imageUrl: card.imageUrl,
        }),
      });
      const data = (await response.json()) as ApiResponse;
      if (!response.ok || !data.ok) {
        if (data.setupRequired) setSetupRequired(true);
        throw new Error(data.error ?? "Gagal menyimpan kartu kelas");
      }
      setSetupRequired(false);
      toast.success(`Kartu Kelas ${card.level} berhasil disimpan.`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSavingLevel(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-white p-8 text-center text-sm text-slate-600">
        Memuat konfigurasi kartu kelas...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {setupRequired && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-bold">Migrasi database diperlukan</p>
          <p className="mt-1">
            Jalankan SQL pada <code>docs/grade-cards-migration.sql</code> di
            Supabase SQL Editor agar gambar dan deskripsi dapat disimpan.
          </p>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        {cards.map((card) => (
          <article
            key={card.level}
            className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="grid sm:grid-cols-[220px_1fr]">
              <div className="relative min-h-52 bg-emerald-100">
                <img
                  src={card.imageUrl}
                  alt={`Pratinjau ${card.name}`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold text-emerald-800">
                  Kelas {card.level}
                </span>
              </div>

              <div className="space-y-4 p-5">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
                    Nama kelas
                  </span>
                  <input
                    value={card.name}
                    onChange={(event) =>
                      updateCard(card.level, { name: event.target.value })
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-400"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
                    Deskripsi
                  </span>
                  <textarea
                    value={card.description}
                    onChange={(event) =>
                      updateCard(card.level, {
                        description: event.target.value,
                      })
                    }
                    rows={4}
                    className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-400"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
                    Gambar kelas
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingLevel === card.level}
                    onChange={(event) => uploadImage(card.level, event)}
                    className="mt-2 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:font-semibold file:text-emerald-700"
                  />
                </label>

                <button
                  type="button"
                  disabled={
                    savingLevel === card.level ||
                    uploadingLevel === card.level ||
                    !card.name.trim()
                  }
                  onClick={() => saveCard(card)}
                  className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingLevel === card.level
                    ? "Menyimpan..."
                    : uploadingLevel === card.level
                      ? "Mengunggah gambar..."
                      : "Simpan Kartu Kelas"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
