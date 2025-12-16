"use client";

import { useEffect, useState } from "react";

type SubscriptionRow = {
  id: string;
  profile_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  plan_id?: string | null;
};

type ApiResponse = {
  ok?: boolean;
  created?: number;
  error?: string;
  message?: string;
};

export default function AdminSubscriptionsPage() {
  const [items, setItems] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Ambil daftar subscription saat halaman dibuka
  useEffect(() => {
    fetchList();
  }, []);

  async function fetchList() {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/subscriptions", {
        credentials: "same-origin",
      });
      const text = await res.text();
      const ct = res.headers.get("content-type") ?? "";

      if (!ct.includes("application/json")) {
        console.error("Non JSON response:", text);
        setItems([]);
        setMessage("Respons server tidak valid.");
        setLoading(false);
        return;
      }

      const json = JSON.parse(text);
      if (!json.ok) {
        setMessage(json.error ?? "Gagal mengambil subscription");
        setItems([]);
        setLoading(false);
        return;
      }

      setItems(json.subscriptions ?? []);
    } catch (err) {
      console.error("fetch subscriptions error:", err);
      setMessage("Gagal mengambil data. Cek console.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate(subscriptionId: string) {
    const yes = confirm("Yakin ingin generate quota untuk subscription ini?");
    if (!yes) return;

    setGeneratingFor(subscriptionId);
    setMessage(null);

    try {
      const res = await fetch("/api/subscriptions/generate_quota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ subscription_id: subscriptionId }),
      });

      const text = await res.text();
      const ct = res.headers.get("content-type") ?? "";
      const json: ApiResponse = ct.includes("application/json")
        ? JSON.parse(text)
        : { ok: false, error: "Non-JSON response" };

      if (res.status === 401) {
        setMessage("Belum login. Silakan login ulang.");
        setGeneratingFor(null);
        return;
      }

      if (!res.ok || !json.ok) {
        setMessage(json.error ?? "Gagal generate quota");
        setGeneratingFor(null);
        return;
      }

      setMessage(`Berhasil generate quota: ${json.created ?? 0}`);
    } catch (err) {
      console.error("generate quota error:", err);
      setMessage("Terjadi kesalahan. Cek console.");
    } finally {
      setGeneratingFor(null);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Subscriptions (Admin)</h1>

      {message && (
        <div className="mt-4 p-3 bg-gray-100 text-gray-900 border rounded">
          {message}
        </div>
      )}

      <div className="mt-6">
        {loading && <div>Memuat data subscription...</div>}

        {!loading && items.length === 0 && (
          <div>Tidak ada subscription ditemukan.</div>
        )}

        <ul className="mt-4 space-y-4">
          {items.map((s) => (
            <li
              key={s.id}
              className="p-4 border rounded flex justify-between items-center"
            >
              <div>
                <div className="font-semibold">ID: {s.id}</div>
                <div className="text-sm text-gray-600">
                  User: {s.profile_id ?? "-"}
                </div>
                <div className="text-sm text-gray-600">
                  Periode: {s.start_date ?? "-"} → {s.end_date ?? "-"}
                </div>
                <div className="text-sm text-gray-600">
                  Paket: {s.plan_id ?? "-"}
                </div>
              </div>

              <button
                onClick={() => handleGenerate(s.id)}
                disabled={generatingFor !== null}
                className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              >
                {generatingFor === s.id ? "Memproses..." : "Generate Quota"}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
