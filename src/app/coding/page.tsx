"use client";

import Image from "next/image";
import { PricingComparisonSection } from "../components/PricingComparisonSection";

export default function CodingPage() {
  return (
    <main className="min-h-screen bg-linear-to-br from-sky-50 via-white to-slate-100 text-slate-900">
      <section className="relative overflow-hidden border-b border-sky-100 bg-linear-to-br from-sky-100/70 via-white to-cyan-50">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-sky-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-16 pt-16 md:flex-row md:items-center md:justify-between md:pt-24">
          <div className="max-w-xl space-y-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-200 bg-sky-100 px-4 py-1 text-xs font-semibold text-sky-700">
              Belajar Coding dari Nol
            </span>
            <h1 className="text-3xl font-extrabold leading-tight text-slate-900 md:text-5xl">
              Bimbel coding untuk anak yang ingin{" "}
              <span className="text-sky-600">bikin proyek nyata.</span>
            </h1>
            <p className="text-sm text-slate-600 md:text-base">
              Mulai dari logika dasar, lanjut ke game sederhana, hingga project
              web mini. Semua terstruktur dan mudah diikuti.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/login?from=coding"
                className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-300/60 transition hover:-translate-y-0.5 hover:bg-sky-700"
              >
                Mulai Sekarang
              </a>
              <a
                href="/coding/curriculum"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200"
              >
                Lihat Kurikulum
              </a>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-slate-500">
              <span>- Proyek nyata</span>
              <span>- Progress jelas</span>
              <span>- Pendampingan terarah</span>
            </div>
          </div>
          <div className="w-full max-w-md rounded-3xl border border-sky-100 bg-white/85 p-5 shadow-[0_30px_70px_-35px_rgba(56,189,248,0.35)] backdrop-blur">
            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="relative h-40 w-full">
                  <Image
                    src="/images/zoomboy.webp"
                    alt="Preview kelas coding"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="p-4">
                  <p className="text-xs font-semibold text-slate-500">
                    Preview kelas coding
                  </p>
                  <p className="mt-2 text-xs text-slate-600">
                    Anak belajar logika sambil membangun mini game dan web.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-500">
                  Progress siswa
                </p>
                <div className="mt-3 space-y-2">
                  <div className="h-3 w-3/4 rounded-full bg-sky-200" />
                  <div className="h-3 w-2/3 rounded-full bg-emerald-200" />
                  <div className="h-3 w-1/2 rounded-full bg-amber-200" />
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold text-slate-500">
                  Proyek mingguan
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-sky-100 px-3 py-2 text-[11px] font-semibold text-sky-700">
                    Game mini
                  </div>
                  <div className="rounded-xl bg-emerald-100 px-3 py-2 text-[11px] font-semibold text-emerald-700">
                    Logika
                  </div>
                  <div className="rounded-xl bg-amber-100 px-3 py-2 text-[11px] font-semibold text-amber-700">
                    Debug
                  </div>
                  <div className="rounded-xl bg-slate-100 px-3 py-2 text-[11px] font-semibold text-slate-600">
                    Review
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                <p className="text-xs font-semibold text-sky-700">
                  Highlight minggu ini
                </p>
                <div className="mt-3 space-y-2 text-xs text-sky-700">
                  <div className="flex items-center justify-between">
                    <span>Proyek selesai</span>
                    <span className="font-semibold text-slate-900">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Logika naik</span>
                    <span className="font-semibold text-slate-900">
                      +2 level
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Target</span>
                    <span className="font-semibold text-slate-900">
                      Web mini
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Logika kuat dulu",
              desc: "Mulai dari pola dan algoritma sederhana sebelum ke proyek.",
            },
            {
              title: "Project-based",
              desc: "Setiap level ada mini project agar anak merasa hasil nyata.",
            },
            {
              title: "Mentor-ready",
              desc: "Pendampingan dan review berkala membuat progres stabil.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-sky-100 bg-white p-6 shadow-[0_20px_60px_-50px_rgba(56,189,248,0.25)]"
            >
              <h3 className="text-lg font-semibold text-slate-900">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="curriculum" className="bg-slate-50 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase text-sky-600">
                Kurikulum singkat
              </p>
              <h2 className="mt-3 text-2xl font-bold text-slate-900">
                Dari logika ke project
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li>- Level 1: logika & pola dasar</li>
                <li>- Level 2: membuat game sederhana</li>
                <li>- Level 3: web mini project</li>
                <li>- Level 4: project pilihan siswa</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-sky-200 bg-sky-50 p-6">
              <p className="text-xs font-semibold uppercase text-sky-700">
                Siap mulai?
              </p>
              <h2 className="mt-3 text-2xl font-bold text-slate-900">
                Coba gratis dan lihat progressnya
              </h2>
              <p className="mt-3 text-sm text-slate-600">
                Anak bisa langsung mencoba, orang tua bisa memantau hasilnya.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="/login?from=coding"
                  className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-300/40 transition hover:-translate-y-0.5 hover:bg-sky-700"
                >
                  Mulai sekarang
                </a>
                <a
                  href="/coding/curriculum"
                  className="inline-flex items-center justify-center rounded-2xl border border-sky-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Detail kurikulum
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { label: "Project nyata", value: "Game, web, dan karya mini" },
              {
                label: "Skill masa depan",
                value: "Logika dan problem solving",
              },
              {
                label: "Progress transparan",
                value: "Laporan untuk orang tua",
              },
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
        <div className="rounded-3xl border border-sky-200 bg-linear-to-r from-sky-100/70 via-white to-white p-6 shadow-[0_20px_60px_-50px_rgba(56,189,248,0.25)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Siap mulai kelas coding?
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Mulai dari nol, naik level dengan proyek nyata.
              </p>
            </div>
            <a
              href="/login?from=coding"
              className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-300/50 transition hover:-translate-y-0.5 hover:bg-sky-700"
            >
              Mulai Sekarang
            </a>
          </div>
        </div>
      </section>

      <div id="pricing"></div>
    </main>
  );
}
