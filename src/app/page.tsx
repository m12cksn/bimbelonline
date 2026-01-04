// src/app/lp/facebook/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const WA_NUMBER = "6285726321786";
const WA_TEXT =
  "Halo, saya dari Facebook. Mau konsultasi belajar matematika anak dan coba 4 soal gratis.";

function waLink() {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_TEXT)}`;
}

const HERO_IMG_SRC = "/images/hero.webp";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type Testi = { quote: string; name: string; meta?: string };

const TESTIMONIALS: Testi[] = [
  {
    quote: "Anak jadi mau latihan sendiri, bukan disuruh terus.",
    name: "Bunda Rani",
    meta: "Kelas 4",
  },
  {
    quote: "PR pecahan sekarang bukan drama lagi di rumah.",
    name: "Ayah Fajar",
    meta: "Kelas 5",
  },
  {
    quote: "Progress tersimpan bikin anak konsisten. Nilainya lebih stabil.",
    name: "Bunda Mira",
    meta: "Kelas 4",
  },
  {
    quote:
      "Metode interaktifnya bikin anak fokus, tidak sekadar tebak-tebakan.",
    name: "Ayah Dimas",
    meta: "Kelas 5",
  },
  {
    quote: "Saya nyesel baru tahu sekarang. Harusnya dari dulu pakai ini.",
    name: "Bunda Sari",
    meta: "Kelas 4",
  },
];

type Faq = { q: string; a: string };
const FAQS: Faq[] = [
  {
    q: "Anak harus install aplikasi?",
    a: "Tidak. Cukup buka link dan latihan langsung di web BeSmartKids.",
  },
  {
    q: "Apakah progress belajar tersimpan otomatis?",
    a: "Iya. Anak bisa lanjut dari soal terakhir, tidak mulai dari awal lagi.",
  },
  {
    q: "Apakah ada paksaan untuk upgrade Premium?",
    a: "Tidak ada. Kita tes dulu 4 soal gratis. Jika cocok dan anak enjoy, baru CS bantu buka akses Premium.",
  },
  {
    q: "Kalau bulan berikutnya tidak perpanjang, apakah masalah?",
    a: "Tidak masalah. Tidak ada kewajiban perpanjang. Kamu bisa lanjut kapan saja.",
  },
  {
    q: "Materinya untuk kelas berapa?",
    a: "Fokus utama kami untuk SD dan SMP kelas 1-9.",
  },
];

function Badge({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
      {children}
    </span>
  );
}

function PrimaryButton({
  href,
  children,
  className,
  onClick,
}: {
  href?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-5 py-3 font-semibold shadow-lg transition active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white";
  const style =
    "bg-emerald-600 text-white shadow-emerald-300/60 hover:-translate-y-0.5 hover:bg-emerald-700 focus:ring-emerald-500";
  if (href) {
    return (
      <a href={href} onClick={onClick} className={cx(base, style, className)}>
        {children}
      </a>
    );
  }
  return (
    <button onClick={onClick} className={cx(base, style, className)}>
      {children}
    </button>
  );
}

function SecondaryButton({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cx(
        "inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white",
        className
      )}
    >
      {children}
    </a>
  );
}

function FeatureCard({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: string;
}) {
  return (
    <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-[0_20px_60px_-50px_rgba(15,23,42,0.25)]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-lg text-emerald-700">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function TestimonialMarquee({ items }: { items: Testi[] }) {
  const list = useMemo(() => [...items, ...items], [items]);
  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-white/80 p-4 shadow-[0_20px_60px_-50px_rgba(16,185,129,0.25)] backdrop-blur">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />

      <div className="flex gap-4 animate-[marquee_30s_linear_infinite] will-change-transform">
        {list.map((t, idx) => (
          <div
            key={idx}
            className="min-w-[280px] max-w-[320px] rounded-2xl border border-slate-200 bg-white p-4"
          >
            <p className="text-sm leading-relaxed text-slate-700">
              “{t.quote}”
            </p>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-900">{t.name}</span>
              <span>{t.meta ?? ""}</span>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}

function Accordion({ items }: { items: Faq[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <div className="rounded-3xl border border-emerald-100 bg-white/80 shadow-[0_20px_60px_-50px_rgba(15,23,42,0.12)]">
      {items.map((it, idx) => {
        const open = idx === openIdx;
        return (
          <div
            key={idx}
            className={cx(
              "border-b border-emerald-100 last:border-b-0",
              open ? "bg-emerald-50/40" : "bg-white/90"
            )}
          >
            <button
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-emerald-50/60"
              onClick={() => setOpenIdx(open ? null : idx)}
              type="button"
              aria-expanded={open}
            >
              <div className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3.5-3.5" />
                  </svg>
                </span>
                <span className="text-sm font-bold text-slate-900">{it.q}</span>
              </div>
              <span
                className={cx(
                  "flex h-8 w-8 items-center justify-center rounded-full border border-emerald-100 bg-white text-emerald-700 transition",
                  open ? "rotate-180" : "rotate-0"
                )}
              >
                <svg
                  viewBox="0 0 20 20"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 8l4 4 4-4" />
                </svg>
              </span>
            </button>
            <div
              className={cx(
                "grid transition-all duration-200 ease-out",
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <div className="px-6 pb-5 text-sm leading-relaxed text-slate-600">
                  {it.a}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function JanuaryPromoTimer() {
  const [timeLeft, setTimeLeft] = useState<string>("Menghitung...");

  useEffect(() => {
    const getDeadline = () => {
      const now = new Date();
      const year =
        now.getMonth() > 0 ? now.getFullYear() + 1 : now.getFullYear();
      return new Date(year, 0, 31, 23, 59, 59);
    };

    const deadline = getDeadline();

    const update = () => {
      const diff = deadline.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Promo berakhir");
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      const pad = (val: number) => String(val).padStart(2, "0");
      setTimeLeft(`${days} hari ${pad(hours)}:${pad(mins)}:${pad(secs)}`);
    };

    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-emerald-200 bg-linear-to-br from-emerald-50 via-white to-amber-50 p-6 text-center shadow-[0_30px_80px_-55px_rgba(16,185,129,0.35)] md:p-8">
      <div className="pointer-events-none absolute -left-8 top-4 h-32 w-32 rounded-full bg-emerald-200/60 blur-2xl" />
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-amber-200/60 blur-2xl" />
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-700">
        Promo Januari
      </p>
      <h3 className="mt-3 text-2xl font-extrabold text-slate-900 md:text-3xl">
        Paket Premium harga spesial hanya bulan Januari
      </h3>
      <div className="mt-3 flex flex-col items-center gap-1">
        <div className="text-sm font-semibold text-slate-400 line-through">
          Rp 149.000
        </div>
        <div className="text-4xl font-extrabold text-emerald-700 md:text-5xl">
          Rp 99.000
        </div>
        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
          per bulan
        </div>
      </div>
      <div className="mx-auto mt-4 w-fit rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-center">
        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
          Sisa waktu
        </p>
        <p className="mt-1 text-lg font-bold text-slate-900">{timeLeft}</p>
      </div>
    </div>
  );
}

export default function FacebookLandingPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 via-slate-100 to-white text-slate-900">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-emerald-100/80 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/logo_horizontal.png"
              alt="BeSmartKids"
              width={160}
              height={40}
              className="h-12 w-auto"
              priority
            />
          </Link>

          <div className="flex items-center gap-2">
            <SecondaryButton href="#demo" className="hidden sm:inline-flex">
              Lihat Demo
            </SecondaryButton>
            <PrimaryButton href={waLink()}>📲 Konsultasi Gratis</PrimaryButton>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-emerald-100/80 bg-linear-to-br from-emerald-100/70 via-white to-sky-50">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-12 md:grid-cols-2 md:py-16">
          {/* Left */}
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge>✔ 1.000+ soal dinamis</Badge>
              <Badge>✔ Progress lanjut otomatis</Badge>
              <Badge>✔ Mentor via WhatsApp</Badge>
              <Badge>✔ Coba 4 soal gratis</Badge>
            </div>

            <h1 className="mt-6 text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl">
              Pendamping Belajar Matematika SD yang{" "}
              <span className="text-emerald-700">Interaktif</span>,{" "}
              <span className="text-emerald-700">Terstruktur</span>, dan{" "}
              <span className="text-emerald-700">
                Progres Tersimpan Otomatis
              </span>
              .
            </h1>

            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Bantu anak paham pecahan, keliling, luas, KPK/FPB, sudut, dan
              lainnya — dengan latihan interaktif yang bikin anak mau balik
              latihan lagi.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <PrimaryButton href={waLink()} className="sm:w-auto">
                📲 Konsultasi Gratis dengan Mentor
              </PrimaryButton>
              <SecondaryButton href="#trust" className="sm:w-auto">
                Lihat Testimoni
              </SecondaryButton>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Tidak ada paksaan upgrade. Tes 4 soal gratis dulu → kalau cocok,
              baru lanjut.
            </p>
          </div>

          {/* Right: HERO IMAGE */}
          <div className="relative">
            <div className="rounded-3xl border border-emerald-100 bg-white/80 p-3 shadow-[0_30px_70px_-35px_rgba(16,185,129,0.35)] backdrop-blur">
              <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-white">
                <Image
                  src={HERO_IMG_SRC}
                  alt="BeSmartKids - Tingkatkan Nilai Anak Tanpa Drama Belajar"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 520px"
                  className="object-cover object-center"
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Mulai Gratis
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  Chat WA Sekarang
                </span>
              </div>

              <div className="mt-3">
                <a
                  href="#demo"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow-lg shadow-emerald-300/60 transition hover:-translate-y-0.5 hover:bg-emerald-700"
                >
                  Lihat Demo 4 Soal Gratis
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section id="trust" className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Orang tua bilang:
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              “Nyesel nggak tahu dari dulu.” — karena yang hilang itu bukan
              uang, tapi waktu belajar yang bisa lebih terarah.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <TestimonialMarquee items={TESTIMONIALS} />
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FeatureCard
            icon="🔁"
            title="Progress lanjut otomatis"
            desc="Anak tidak mulai dari nol. Setiap latihan tersimpan dan bisa dilanjutkan kapan saja."
          />
          <FeatureCard
            icon="🧩"
            title="Soal dinamis (bukan 100 halaman)"
            desc="Ribuan soal dikelola rapi dan tampil dinamis, jadi pengalaman belajar konsisten."
          />
          <FeatureCard
            icon="✍️"
            title="Coret-coret untuk pahami konsep"
            desc="Whiteboard bantu anak menyusun langkah berpikir, bukan menebak jawaban."
          />
          <FeatureCard
            icon="💬"
            title="Mentor responsif via WhatsApp"
            desc="CS/mentor bantu arahkan materi yang cocok dan dorong anak tetap konsisten."
          />
        </div>
      </section>

      {/* Demo */}
      <section id="demo" className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8">
          <JanuaryPromoTimer />
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-[0_20px_60px_-50px_rgba(16,185,129,0.20)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                Coba 4 soal gratis dulu
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Biar anaknya yang “klik” dulu. Kalau cocok, baru kita lanjut
                Premium.
              </p>
            </div>
            <PrimaryButton href={waLink()} className="sm:w-auto">
              📲 Minta Arahan Mentor
            </PrimaryButton>
          </div>

          <div className="mt-6 rounded-3xl border border-emerald-200 bg-linear-to-br from-emerald-600 via-emerald-500 to-teal-400 p-6 text-white shadow-[0_22px_60px_-30px_rgba(16,185,129,0.6)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
                  Latihan gratis
                </p>
                <h3 className="mt-2 text-2xl font-extrabold">
                  Link latihan langsung — tanpa ribet
                </h3>
                <p className="mt-2 text-sm text-emerald-50">
                  Klik tombol di kanan untuk langsung ke latihan 4 soal gratis.
                  Fokusnya: anak cepat “klik” dan kamu lihat hasilnya.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/materials/1"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-emerald-700 shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:bg-emerald-50"
                >
                  🚀 Buka Latihan Gratis
                </Link>
                <a
                  href={waLink()}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/40 bg-emerald-700/60 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:bg-emerald-700"
                >
                  Tanya via WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="bg-linear-to-br from-emerald-50 via-white to-emerald-50 py-14"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Pricing
              </p>
              <h2 className="mt-3 text-3xl font-extrabold text-slate-900 md:text-4xl">
                Pilih paket yang paling cocok
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
                Benefit paket disamakan dengan halaman upgrade: full video, soal
                lebih banyak, progres tersimpan, dan opsi Zoom.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-500 shadow-sm">
              <span className="font-semibold text-slate-700">Promo</span>
              <span>Paket Premium Rp 145rb → Rp 99rb</span>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.25)]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Paket Premium
                </p>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                  Populer
                </span>
              </div>
              <div className="mt-4">
                <p className="text-sm font-semibold text-slate-400 line-through">
                  Rp 145.000
                </p>
                <p className="text-4xl font-extrabold text-slate-900">
                  Rp 99.000
                </p>
                <p className="text-xs text-slate-500">per bulan</p>
              </div>
              <ul className="mt-5 space-y-2 text-sm text-slate-700">
                <li>✓ Baca ringkasan materi</li>
                <li>✓ Tonton full video</li>
                <li>✓ Kerjakan soal 1–30</li>
                <li>✓ Progress tersimpan</li>
                <li>✓ Try-out 1×/bulan</li>
                <li>✓ Report skor</li>
                <li>✓ Badge Premium</li>
              </ul>
              <a
                href="https://wa.me/6285726321786?text=Halo%20BeSmartKids,%20saya%20ingin%20daftar%20Paket%20Premium%2099rb%20per%20bulan."
                className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-300/60 transition hover:-translate-y-0.5 hover:bg-emerald-700"
              >
                Pilih Paket Premium
              </a>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.18)]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Bundling 3 Bulan
                </p>
                <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
                  Hemat
                </span>
              </div>
              <div className="mt-4">
                <p className="text-4xl font-extrabold text-slate-900">
                  Rp 419.000
                </p>
                <p className="text-xs text-slate-500">sekali bayar</p>
              </div>
              <ul className="mt-5 space-y-2 text-sm text-slate-700">
                <li>✓ Baca ringkasan materi</li>
                <li>✓ Tonton full video</li>
                <li>✓ Kerjakan soal 1–40</li>
                <li>✓ Progress tersimpan</li>
                <li>✓ Try-out 2×/bulan</li>
                <li>✓ Report skor</li>
                <li>✓ Badge 3-Bulan</li>
              </ul>
              <a
                href="https://wa.me/6285726321786?text=Halo%20BeSmartKids,%20saya%20ingin%20ambil%20Bundling%203%20Bulan%20419rb."
                className="mt-6 inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-200"
              >
                Pilih Bundling 3 Bulan
              </a>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.25)]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Zoom Premium 15 Kelas
                </p>
                <span className="rounded-full bg-purple-50 px-2 py-1 text-[10px] font-semibold text-purple-700">
                  Zoom
                </span>
              </div>
              <div className="mt-4">
                <p className="text-sm font-semibold text-slate-400 line-through">
                  Rp 1.500.000
                </p>
                <p className="text-4xl font-extrabold text-slate-900">
                  Rp 1.350.000
                </p>
                <p className="text-xs text-slate-500">paket 15 kelas</p>
              </div>
              <ul className="mt-5 space-y-2 text-sm text-slate-700">
                <li>✓ Baca ringkasan materi</li>
                <li>✓ Tonton full video</li>
                <li>✓ Kerjakan soal 1–40</li>
                <li>✓ Progress tersimpan</li>
                <li>✓ Try-out 2×/bulan + Zoom</li>
                <li>✓ Report skor</li>
                <li>✓ Badge Zoom Premium</li>
              </ul>
              <a
                href="https://wa.me/6285726321786?text=Halo%20BeSmartKids,%20saya%20ingin%20daftar%20Zoom%20Premium%2015%20Kelas%201350rb."
                className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-300/50 transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Pilih Zoom Premium
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-3xl border border-emerald-100 bg-white/90 p-6 shadow-[0_24px_70px_-50px_rgba(16,185,129,0.25)] md:p-8">
          <div className="grid gap-6 md:grid-cols-[1fr,1.1fr] md:items-start">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase text-emerald-700">
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 5h16v12H7l-3 3V5z" />
                </svg>
                FAQ
              </p>
              <h2 className="mt-3 text-2xl font-extrabold text-slate-900">
                Jawaban singkat untuk pertanyaan orang tua
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Bagian ini menghapus keraguan umum tentang cara belajar, biaya,
                dan akses soal.
              </p>
            </div>
            <Accordion items={FAQS} />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative mx-auto max-w-6xl px-4 pb-32 sm:pb-24">
        <div className="absolute inset-x-4 bottom-0 sm:static">
          <div className="rounded-3xl border border-emerald-100 bg-linear-to-r from-emerald-100/70 via-white to-white p-6 shadow-[0_20px_60px_-50px_rgba(16,185,129,0.25)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Siap mulai hari ini?
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Klik WhatsApp, sebutkan kelas anak, dan saya bantu arahkan
                  latihan yang paling cocok.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <PrimaryButton href={waLink()} className="sm:w-auto">
                  📲 Konsultasi Gratis via WhatsApp
                </PrimaryButton>
                <Link
                  href="/materials/1"
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400"
                >
                  Coba Gratis
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-emerald-100 bg-white px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Image
              src="/images/logo_horizontal.png"
              alt="BeSmartKids"
              width={160}
              height={40}
              className="h-12 w-auto"
            />
            <div className="text-xs text-slate-500">
              © {new Date().getFullYear()} — Bimbel Online Matematika SD
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500"></p>
        </div>
      </footer>
    </div>
  );
}
