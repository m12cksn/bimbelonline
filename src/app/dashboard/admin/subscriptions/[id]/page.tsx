"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ApiResponse = {
  ok?: boolean;
  created?: number;
  error?: string;
  message?: string;
};

export default function SubscriptionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const subscriptionId = params.id;
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // optional: kalau mau fetch info subscription dari API nanti,
  // bisa tambahkan fetch ke /api/subscriptions/[id] — sekarang kita hanya show ID

  useEffect(() => {
    setResult(null);
    setError(null);
  }, [subscriptionId]);

  async function handleGenerateQuota() {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/subscriptions/generate_quota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ subscription_id: subscriptionId }),
      });

      const text = await res.text();
      const ct = res.headers.get("content-type") ?? "";

      if (!ct.includes("application/json")) {
        // server mungkin mereturn HTML (redirect/error) — tampilkan preview
        console.error("generate_quota: non-json response:", text);
        setError("Respons server tidak valid (buka console untuk detail).");
        setLoading(false);
        return;
      }

      const json = JSON.parse(text) as ApiResponse;

      if (res.status === 401) {
        setError("Kamu belum login atau session habis. Silakan login ulang.");
        // opsional: arahkan ke halaman login
        // window.location.href = "/login";
        setLoading(false);
        return;
      }

      if (!res.ok || !json.ok) {
        setError(json.error ?? json.message ?? "Gagal generate quota");
        setLoading(false);
        return;
      }

      setResult(json);
    } catch (err) {
      console.error("handleGenerateQuota error:", err);
      setError("Terjadi kesalahan, cek console untuk detail.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Subscription — Generate Zoom Quota</h1>

      <div className="mt-4 p-4 border rounded">
        <p>
          <span className="font-medium">Subscription ID:</span>{" "}
          <span className="text-sm">{subscriptionId}</span>
        </p>

        <p className="mt-2 text-sm text-gray-600">
          Catatan: Pastikan kamu login sebagai admin. Tombol di bawah akan
          memanggil endpoint
          <code className="bg-gray-100 px-1 rounded ml-1">
            POST /api/subscriptions/generate_quota
          </code>
          .
        </p>

        <div className="mt-4 flex gap-3">
          <button
            onClick={handleGenerateQuota}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Generate Zoom Quota"}
          </button>

          <button
            onClick={() => router.push("/dashboard/admin/classes")}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Kembali ke Classes
          </button>
        </div>

        <div className="mt-4">
          {error && (
            <div className="p-3 bg-red-100 text-red-800 rounded">
              Error: {error}
            </div>
          )}

          {result && result.ok && (
            <div className="p-3 bg-green-100 text-green-800 rounded">
              Berhasil generate quota. Jumlah dibuat/update:{" "}
              {result.created ?? 0}
            </div>
          )}

          {result && !result.ok && result.error && (
            <div className="p-3 bg-red-100 text-red-800 rounded">
              {result.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
