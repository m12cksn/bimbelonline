"use client";

export default function CodingCurriculumPage() {
  return (
    <main className="min-h-screen bg-linear-to-br from-sky-50 via-white to-slate-100 text-slate-900">
      <section className="relative overflow-hidden border-b border-sky-100 bg-linear-to-br from-sky-100/70 via-white to-cyan-50">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-sky-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-200 bg-sky-100 px-4 py-1 text-xs font-semibold text-sky-700">
              Kurikulum Coding
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 md:text-5xl">
              3 Level, dari logika ke proyek nyata
            </h1>
            <p className="text-sm text-slate-600 md:text-base">
              Kurikulum dibuat bertahap agar anak paham konsep, berani mencoba,
              dan punya karya yang bisa dibanggakan.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/login?from=coding"
                className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-300/60 transition hover:-translate-y-0.5 hover:bg-sky-700"
              >
                Coba Gratis Coding
              </a>
              <a
                href="/coding"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200"
              >
                Kembali ke landing
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Level 1 - Code Explorer",
              desc: "Logika dasar, pola, dan algoritma sederhana. Anak belajar cara berpikir runtut sebelum menulis kode.",
              highlights: ["Pola & urutan", "Percabangan dasar", "Latihan logika"],
              project: "Mini puzzle logika",
            },
            {
              title: "Level 2 - Game Builder",
              desc: "Menggabungkan logika dengan interaksi. Anak mulai membuat game kecil dan memahami loop serta kondisi.",
              highlights: ["Game interaktif", "Loop & kondisi", "Debug dasar"],
              project: "Game tebak angka",
            },
            {
              title: "Level 3 - App Creator",
              desc: "Membangun project web/app sederhana. Fokus pada struktur, tampilan, dan presentasi hasil.",
              highlights: ["Project web mini", "Struktur file", "Presentasi karya"],
              project: "Portfolio mini",
            },
          ].map((level) => (
            <div
              key={level.title}
              className="flex h-full flex-col rounded-3xl border border-sky-100 bg-white p-6 shadow-[0_20px_60px_-50px_rgba(56,189,248,0.25)]"
            >
              <h2 className="text-lg font-semibold text-slate-900">
                {level.title}
              </h2>
              <p className="mt-2 text-sm text-slate-600">{level.desc}</p>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                {level.highlights.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sky-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-700">
                <span className="text-xs font-semibold text-sky-700">
                  Contoh proyek
                </span>
                <p className="mt-1 font-semibold">{level.project}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Output yang diharapkan
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li>- Anak mampu berpikir algoritmis</li>
                <li>- Paham konsep loop dan kondisi</li>
                <li>- Punya minimal 3 proyek nyata</li>
                <li>- Berani mempresentasikan karya</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-sky-200 bg-sky-50 p-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Dukungan untuk orang tua
              </h3>
              <p className="mt-3 text-sm text-slate-600">
                Orang tua bisa memantau progres, melihat proyek anak, dan
                mendapatkan ringkasan perkembangan tiap bulan.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="/login?from=coding"
                  className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-300/40 transition hover:-translate-y-0.5 hover:bg-sky-700"
                >
                  Mulai sekarang
                </a>
                <a
                  href="/coding"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700"
                >
                  Lihat landing
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
