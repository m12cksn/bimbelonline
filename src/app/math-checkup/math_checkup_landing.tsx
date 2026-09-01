"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trackMetaEvent } from "@/lib/meta-pixel";

const checkupBenefits = [
  [
    "Peta kemampuan",
    "Anak mendapat gambaran kemampuan matematika per kompetensi.",
  ],
  [
    "Rekomendasi belajar",
    "Hasil tes memberi arahan materi yang perlu dikuatkan berikutnya.",
  ],
  [
    "Langkah terarah",
    "BeSmartKids membantu anak belajar dari fondasi, bukan sekadar mengejar nilai.",
  ],
];

export default function MathCheckupLanding() {
  const router = useRouter();
  const [studentName, setStudentName] = useState("");
  const [parentWhatsapp, setParentWhatsapp] = useState("");
  // const [gradeLevel, setGradeLevel] = useState("4");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const diagnosticLevels = [
    {
      value: "grade_1_2",
      label: "Kelas 1–2",
      shortLabel: "1–2",
      description: "Fondasi matematika dasar",
    },
    {
      value: "grade_3_4",
      label: "Kelas 3–4",
      shortLabel: "3–4",
      description: "Matematika dasar dan problem solving",
    },
    {
      value: "grade_5_6",
      label: "Kelas 5–6",
      shortLabel: "5–6",
      description: "Pecahan, desimal, geometri, dan reasoning",
    },
    {
      value: "grade_7_9",
      label: "SMP",
      shortLabel: "7–9",
      description: "Matematika kelas 7–9",
    },
    {
      value: "grade_10_12",
      label: "SMA",
      shortLabel: "10–12",
      description: "Matematika kelas 10–12",
    },
    {
      value: "olympiad",
      label: "Olimpiade",
      shortLabel: "🏆",
      description: "Problem solving dan mathematical reasoning",
    },
  ];

  const [diagnosticLevel, setDiagnosticLevel] = useState("grade_3_4");

  async function startCheckup(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/diagnostic/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          parentWhatsapp,
          // gradeLevel: Number(gradeLevel),
          diagnosticLevel,
          concern: "Math Check-Up BeSmartKids",
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        attemptId?: string;
        error?: string;
      };
      if (!response.ok || !data.ok || !data.attemptId) {
        throw new Error(data.error ?? "Gagal memulai cek kemampuan.");
      }
      trackMetaEvent("Lead", {
        content_name: "Free Math Checkup",
        content_category: "Math Diagnostic",
      });
      router.push(`/math-checkup/test/${data.attemptId}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#ecfdf3] p-4 text-slate-950 sm:p-6 lg:p-8">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-5 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative overflow-hidden border border-slate-200 bg-white p-5 shadow-[0_28px_90px_-64px_rgba(15,23,42,0.95)] sm:p-7 lg:p-8">
          <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-emerald-100 blur-3xl" />
          <div className="pointer-events-none absolute -right-28 bottom-24 h-72 w-72 rounded-full bg-emerald-100 blur-3xl" />

          <div className="relative z-10 flex items-center justify-between gap-4">
            <img
              src="/images/logo_horizontal.png"
              alt="BeSmartKids"
              className="h-12 w-auto object-contain"
            />
            <span className="hidden border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 sm:inline-flex">
              Gratis
            </span>
          </div>

          <div className="relative z-10 mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr] xl:items-center">
            <div>
              <div className="mb-4 inline-flex border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
                20 soal • 10-15 menit • laporan visual
              </div>
              <h1 className="max-w-xl text-4xl font-black leading-[0.98] tracking-tight text-[#102449] sm:text-5xl lg:text-6xl">
                Math Check-Up
              </h1>
              <p className="mt-5 max-w-xl text-base font-semibold leading-relaxed text-slate-700">
                Tes singkat untuk mengetahui kekuatan anak, bagian yang perlu
                dikuatkan, dan rekomendasi belajar yang lebih terarah untuk
                orang tua.
              </p>
            </div>

            <div className="relative min-h-[280px] overflow-visible border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-4 shadow-[0_24px_70px_-54px_rgba(15,23,42,0.9)] sm:min-h-[330px]">
              <div className="absolute inset-x-10 bottom-8 h-12 rounded-full bg-slate-900/15 blur-2xl" />
              <img
                src="/images/diag/diag.webp"
                alt="Anak belajar matematika menggunakan tablet"
                className="relative z-10 mx-auto h-full max-h-[330px] w-full object-contain object-center"
              />
            </div>
          </div>

          <div className="relative z-10 mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["Adaptif", "Soal sesuai jenjang kelas"],
              ["Terukur", "Skor per kompetensi"],
              ["Personal", "Rekomendasi belajar anak"],
            ].map(([title, desc]) => (
              <div
                key={title}
                className="border border-slate-200 bg-white/95 p-4 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.7)]"
              >
                <p className="text-sm font-black text-[#102449]">{title}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {desc}
                </p>
              </div>
            ))}
          </div>

          <div className="relative z-10 mt-6 border border-emerald-100 bg-[#f7fef9] p-4 sm:p-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black text-[#102449]">
                  Pilih jenjang diagnostic
                </p>

                <p className="text-xs font-semibold text-slate-500">
                  Soal akan menyesuaikan jenjang kemampuan anak.
                </p>
              </div>

              <p className="text-xs font-black text-emerald-700">
                {
                  diagnosticLevels.find(
                    (level) => level.value === diagnosticLevel,
                  )?.label
                }
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {diagnosticLevels.map((level) => {
                const selected = diagnosticLevel === level.value;

                return (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setDiagnosticLevel(level.value)}
                    className={`text-left border p-4 transition ${
                      selected
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-[0_12px_28px_-18px_rgba(5,150,105,0.9)]"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-base font-black">
                        {level.label}
                      </span>

                      <span
                        className={`text-xs font-black ${
                          selected ? "text-emerald-100" : "text-emerald-700"
                        }`}
                      >
                        {level.shortLabel}
                      </span>
                    </div>

                    <p
                      className={`mt-2 text-xs font-semibold leading-relaxed ${
                        selected ? "text-emerald-50" : "text-slate-500"
                      }`}
                    >
                      {level.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <form
          onSubmit={startCheckup}
          className="relative border border-slate-200 bg-white p-5 shadow-[0_28px_90px_-64px_rgba(15,23,42,0.95)] sm:p-7 lg:p-8"
        >
          <div className="border border-emerald-100 bg-gradient-to-br from-emerald-900 to-emerald-600 p-5 text-white shadow-[0_18px_50px_-36px_rgba(5,150,105,0.9)]">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-100">
              Form calon murid
            </p>
            <h2 className="mt-2 text-3xl font-black">Mulai Math Check-Up</h2>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-emerald-50">
              Isi data berikut agar laporan hasil dapat dibuat sesuai profil
              anak.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">
                Nama anak
              </span>
              <input
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="mt-2 w-full border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none transition focus:border-emerald-500 focus:bg-white focus:shadow-[0_0_0_4px_rgba(16,185,129,0.14)]"
                placeholder="Contoh: Aisyah"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">
                WhatsApp orang tua
              </span>
              <input
                required
                value={parentWhatsapp}
                onChange={(e) => setParentWhatsapp(e.target.value)}
                className="mt-2 w-full border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none transition focus:border-emerald-500 focus:bg-white focus:shadow-[0_0_0_4px_rgba(16,185,129,0.14)]"
                placeholder="Contoh: 081234567890"
              />
            </label>

            <div className="border border-emerald-100 bg-emerald-50/60 p-4">
              <span className="text-sm font-black text-slate-800">
                Yang didapat dari Math Check-Up
              </span>
              <div className="mt-3 space-y-2">
                {checkupBenefits.map(([title, desc]) => (
                  <div
                    key={title}
                    className="border border-white bg-white/85 p-3 shadow-[0_12px_32px_-28px_rgba(15,23,42,0.7)]"
                  >
                    <p className="text-xs font-black text-emerald-700">
                      {title}
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
                      {desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="mt-6 w-full bg-emerald-600 px-5 py-4 text-base font-black text-white shadow-[0_18px_50px_-34px_rgba(5,150,105,0.95)] transition hover:bg-emerald-800 disabled:opacity-60"
          >
            {loading
              ? "Menyiapkan tes..."
              : `Mulai ${
                  diagnosticLevels.find(
                    (level) => level.value === diagnosticLevel,
                  )?.label
                }`}
          </button>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] font-black text-slate-500">
            <span className="border border-slate-200 bg-slate-50 px-2 py-2">
              20 soal
            </span>
            <span className="border border-slate-200 bg-slate-50 px-2 py-2">
              Gratis
            </span>
            <span className="border border-slate-200 bg-slate-50 px-2 py-2">
              Hasil instan
            </span>
          </div>
        </form>
      </section>
    </main>
  );
}
