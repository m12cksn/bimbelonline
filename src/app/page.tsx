"use client";

import { PricingComparisonSection } from "./components/PricingComparisonSection";

export default function Page() {
  return (
    <main className="min-h-screen bg-linear-to-br from-emerald-50 via-slate-100 to-white text-slate-900">
      <section className="relative overflow-hidden border-b border-emerald-100/80 bg-linear-to-br from-emerald-100/70 via-white to-sky-50">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-16 pt-16 md:flex-row md:items-center md:justify-between md:pt-24">
          <div className="max-w-xl space-y-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-100 px-4 py-1 text-xs font-semibold text-emerald-700">
              Belajar Matematika Lebih Terarah
            </span>
            <h1 className="text-3xl font-extrabold leading-tight text-slate-900 md:text-5xl">
              Bimbel digital yang membuat anak paham konsep dan{" "}
              <span className="text-emerald-600">naik level lebih cepat.</span>
            </h1>
            <p className="text-sm text-slate-600 md:text-base">
              Materi rapi per kelas, latihan adaptif, dan insight progres yang
              jelas. Cocok untuk siswa SD-SMP yang butuh hasil nyata tanpa stres.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-300/60 transition hover:-translate-y-0.5 hover:bg-emerald-700"
              >
                Coba Gratis
              </a>
              <a
                href="#pricing"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200"
              >
                Lihat Paket
              </a>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-slate-500">
              <span>- Latihan terstruktur</span>
              <span>- Analisis hasil otomatis</span>
              <span>- Kelas Zoom pilihan</span>
            </div>
          </div>
          <div className="w-full max-w-md rounded-3xl border border-emerald-100 bg-white/80 p-5 shadow-[0_30px_70px_-35px_rgba(16,185,129,0.35)] backdrop-blur">
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-500">
                  Dashboard siswa
                </p>
                <div className="mt-3 space-y-2">
                  <div className="h-3 w-3/4 rounded-full bg-emerald-200" />
                  <div className="h-3 w-2/3 rounded-full bg-sky-200" />
                  <div className="h-3 w-1/2 rounded-full bg-amber-200" />
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold text-slate-500">
                  Latihan soal harian
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-emerald-100 px-3 py-2 text-[11px] font-semibold text-emerald-700">
                    Level naik
                  </div>
                  <div className="rounded-xl bg-sky-100 px-3 py-2 text-[11px] font-semibold text-sky-700">
                    Skor stabil
                  </div>
                  <div className="rounded-xl bg-amber-100 px-3 py-2 text-[11px] font-semibold text-amber-700">
                    Analisis
                  </div>
                  <div className="rounded-xl bg-slate-100 px-3 py-2 text-[11px] font-semibold text-slate-600">
                    Tryout
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-semibold text-emerald-700">
                  Highlight minggu ini
                </p>
                <div className="mt-3 space-y-2 text-xs text-emerald-900">
                  <div className="flex items-center justify-between">
                    <span>Latihan selesai</span>
                    <span className="font-semibold text-slate-900">4 sesi</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Akurasi</span>
                    <span className="font-semibold text-slate-900">87%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Target berikutnya</span>
                    <span className="font-semibold text-slate-900">Level 3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-6">
        <div className="grid gap-4 md:grid-cols-2">
          <a
            href="/"
            className="rounded-3xl border border-emerald-200 bg-white px-5 py-4 text-left shadow-[0_16px_40px_-30px_rgba(16,185,129,0.35)] transition hover:-translate-y-0.5"
          >
            <p className="text-xs font-semibold uppercase text-emerald-600">
              Jalur Matematika
            </p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">
              Fokus nilai dan pemahaman konsep
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Materi rapi per kelas, latihan adaptif, dan analisis progres.
            </p>
          </a>
          <a
            href="/coding"
            className="rounded-3xl border border-sky-200 bg-white px-5 py-4 text-left shadow-[0_16px_40px_-30px_rgba(59,130,246,0.35)] transition hover:-translate-y-0.5"
          >
            <p className="text-xs font-semibold uppercase text-sky-600">
              Jalur Coding
            </p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">
              Skill masa depan lewat proyek nyata
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Belajar logika, bikin game kecil, dan proyek web sederhana.
            </p>
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Progres terlihat jelas",
              desc: "Pantau materi yang sudah dikuasai dan fokuskan latihan berikutnya.",
            },
            {
              title: "Materi bertahap",
              desc: "Belajar dari dasar sampai mahir tanpa loncatan yang bikin bingung.",
            },
            {
              title: "Pendampingan premium",
              desc: "Zoom kelas, laporan detail, dan latihan tambahan saat dibutuhkan.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-[0_20px_60px_-50px_rgba(15,23,42,0.25)]"
            >
              <h3 className="text-lg font-semibold text-slate-900">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase text-emerald-600">
                Kenapa MathKids?
              </p>
              <h2 className="mt-3 text-2xl font-bold text-slate-900">
                Dari konsep ke hasil nyata
              </h2>
              <p className="mt-3 text-sm text-slate-600">
                Siswa tidak hanya mengerjakan soal, tapi memahami langkahnya.
                Orang tua dan guru melihat progres yang jelas dan mudah dipantau.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li>- Kurikulum terstruktur per kelas</li>
                <li>- Latihan adaptif dengan pembahasan</li>
                <li>- Riwayat attempt dan statistik lengkap</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-emerald-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase text-emerald-600">
                Ringkas dan praktis
              </p>
              <h2 className="mt-3 text-2xl font-bold text-slate-900">
                Coba gratis, upgrade saat siap
              </h2>
              <p className="mt-3 text-sm text-slate-600">
                Paket free cukup untuk mulai belajar. Saat butuh lebih, upgrade
                langsung dari dashboard tanpa ribet.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-300/40 transition hover:-translate-y-0.5 hover:bg-emerald-700"
                >
                  Mulai sekarang
                </a>
                <a
                  href="#pricing"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Lihat paket
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { label: "Kurikulum SD-SMP", value: "Materi bertahap dan rapi" },
              { label: "Latihan adaptif", value: "Naik level dengan stabil" },
              { label: "Insight jelas", value: "Pantau progres dalam hitungan menit" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600"
              >
                <p className="text-xs font-semibold uppercase text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 text-sm text-slate-700">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-3xl border border-emerald-200 bg-linear-to-r from-emerald-100/70 via-white to-white p-6 shadow-[0_20px_60px_-50px_rgba(16,185,129,0.35)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Siap bantu anak naik kelas?
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Mulai dari materi yang paling dibutuhkan. Kami bantu sampai paham.
              </p>
            </div>
            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-300/50 transition hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              Coba Gratis
            </a>
          </div>
        </div>
      </section>

      <div id="pricing">
        <PricingComparisonSection />
      </div>
    </main>
  );
}
