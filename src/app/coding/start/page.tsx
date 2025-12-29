"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabaseClient";

type PackageOption = {
  code: "CODING_15" | "CODING_30";
  name: string;
  sessions: number;
  priceIdr: number;
  highlight: string;
};

const PACKAGES: PackageOption[] = [
  {
    code: "CODING_15",
    name: "Paket 15 Kelas",
    sessions: 15,
    priceIdr: 1500000,
    highlight: "Cocok untuk mulai & melihat progres cepat.",
  },
  {
    code: "CODING_30",
    name: "Paket 30 Kelas",
    sessions: 30,
    priceIdr: 2800000,
    highlight: "Lebih panjang, cocok untuk anak serius.",
  },
];

function formatIdr(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export default function CodingStartPage() {
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedPackage, setSelectedPackage] =
    useState<PackageOption>(PACKAGES[0]);
  const [submitted, setSubmitted] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (!data.user) {
        router.push("/login?from=coding");
        return;
      }
      const name =
        (data.user.user_metadata?.full_name as string | undefined) ??
        data.user.email ??
        "";
      setFullName(name);
      setLoading(false);
    }
    void load();
    return () => {
      active = false;
    };
  }, [router, supabase]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) return;
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("fullName", fullName.trim());
      form.append("phone", phone.trim());
      if (notes.trim()) {
        form.append("notes", notes.trim());
      }
      form.append("packageCode", selectedPackage.code);
      form.append("hasPaid", String(hasPaid));
      if (proofFile) {
        form.append("proof", proofFile);
      }

      const res = await fetch("/api/coding/register", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal mengirim pendaftaran.");
      }
      setSubmitted(true);
    } catch {
      setSubmitted(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-linear-to-br from-sky-50 via-white to-slate-100 text-slate-900">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6">
          <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-[0_20px_60px_-40px_rgba(56,189,248,0.2)]">
            Memuat pendaftaran coding...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-sky-50 via-white to-slate-100 text-slate-900">
      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-3xl border border-sky-100 bg-white p-8 shadow-[0_24px_70px_-50px_rgba(56,189,248,0.25)]">
          <div className="space-y-4">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-200 bg-sky-100 px-4 py-1 text-xs font-semibold text-sky-700">
              Pendaftaran Coding
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 md:text-3xl">
              Form pendaftaran kelas coding
            </h1>
            <p className="text-sm text-slate-600">
              Pilih paket coding dan isi data siswa. Setelah dikirim, status
              akan menunggu konfirmasi admin.
            </p>
          </div>

          {submitted ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-800">
              <p className="font-semibold">
                Pendaftaran terkirim. Menunggu konfirmasi admin.
              </p>
              <p className="mt-2 text-xs text-emerald-700">
                Admin akan menghubungi lewat WhatsApp untuk proses lanjut.
              </p>
              <div className="mt-4 flex gap-3">
                <a
                  href="/coding"
                  className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold text-emerald-700"
                >
                  Kembali ke landing
                </a>
                <a
                  href="/dashboard/student"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
                >
                  Ke dashboard
                </a>
              </div>
            </div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Nama siswa
                  </label>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    WhatsApp orang tua
                  </label>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    placeholder="Contoh: 08123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Pilih paket
                </label>
                <div className="mt-2 grid gap-3 md:grid-cols-2">
                  {PACKAGES.map((pkg) => (
                    <label
                      key={pkg.code}
                      className={`flex cursor-pointer flex-col gap-2 rounded-2xl border px-4 py-3 text-sm ${
                        selectedPackage.code === pkg.code
                          ? "border-sky-500 bg-sky-50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">
                          {pkg.name}
                        </span>
                        <input
                          type="radio"
                          name="package"
                          checked={selectedPackage.code === pkg.code}
                          onChange={() => setSelectedPackage(pkg)}
                        />
                      </div>
                      <p className="text-xs text-slate-600">{pkg.highlight}</p>
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>{pkg.sessions} kelas</span>
                        <span className="font-semibold text-slate-900">
                          Rp {formatIdr(pkg.priceIdr)}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Catatan tambahan (opsional)
                </label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600">
                  Bukti transfer (opsional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="text-xs text-slate-700"
                  onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                />
                <label className="flex items-center gap-2 text-[11px] text-slate-600">
                  <input
                    type="checkbox"
                    checked={hasPaid}
                    onChange={(e) => setHasPaid(e.target.checked)}
                  />
                  Saya sudah transfer, mohon dicek admin.
                </label>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                Jika sudah transfer, unggah bukti agar admin bisa approve lebih
                cepat. Admin tetap akan mengonfirmasi lewat WhatsApp.
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-300/40 transition hover:-translate-y-0.5 hover:bg-sky-700 disabled:opacity-60"
              >
                {submitting ? "Mengirim..." : "Kirim pendaftaran"}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
