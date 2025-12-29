// src/app/PricingComparisonSection.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, useMemo } from "react";

function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ");
}

function CTAButton({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "indigo" | "amber" | "dark";
  className?: string;
}) {
  const styles =
    variant === "primary"
      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
      : variant === "indigo"
      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
      : variant === "amber"
      ? "bg-amber-500 hover:bg-amber-600 text-white"
      : "bg-slate-900 hover:bg-slate-800 text-white";

  return (
    <Link
      href={href}
      className={cx(
        "inline-flex items-center justify-center w-full text-center font-semibold rounded-xl shadow-sm",
        "h-[48px] md:h-[56px] px-5 text-sm md:text-base",
        styles,
        className
      )}
    >
      {children}
    </Link>
  );
}

function PriceCard({
  tone,
  badge,
  title,
  price,
  sub,
  bullets,
  ctaText,
  ctaHref,
  highlight,
  footerNote,
}: {
  tone: "slate" | "indigo" | "emerald" | "amber" | "violet";
  badge?: string;
  title: string;
  price: string;
  sub: string;
  bullets: string[];
  ctaText: string;
  ctaHref: string;
  highlight?: boolean;
  footerNote?: string;
}) {
  const toneMap: Record<
    typeof tone,
    {
      bg: string;
      border: string;
      badge: string;
      btn: "primary" | "indigo" | "amber" | "dark";
    }
  > = {
    slate: {
      bg: "bg-white",
      border: "border-slate-200",
      badge: "bg-slate-900 text-white",
      btn: "dark",
    },
    indigo: {
      bg: "bg-indigo-50",
      border: "border-indigo-200",
      badge: "bg-indigo-600 text-white",
      btn: "indigo",
    },
    emerald: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      badge: "bg-emerald-600 text-white",
      btn: "primary",
    },
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      badge: "bg-amber-500 text-white",
      btn: "amber",
    },
    violet: {
      bg: "bg-violet-50",
      border: "border-violet-200",
      badge: "bg-violet-600 text-white",
      btn: "indigo",
    },
  };

  const t = toneMap[tone];

  return (
    <div
      className={cx(
        "relative rounded-2xl border p-6 shadow-sm flex flex-col h-full",
        t.bg,
        t.border,
        highlight && "ring-2 ring-emerald-300 shadow-md"
      )}
    >
      {badge && (
        <div className="absolute -top-3 left-6">
          <span
            className={cx(
              "px-3 py-1 rounded-full text-[11px] md:text-xs font-extrabold shadow-sm",
              t.badge
            )}
          >
            {badge}
          </span>
        </div>
      )}

      <div className="mt-2">
        <h3 className="text-lg md:text-xl font-extrabold text-slate-900">
          {title}
        </h3>

        <div className="mt-3">
          <p className="text-3xl md:text-4xl font-extrabold text-slate-900">
            {price}
          </p>
          <p className="mt-1 text-slate-600 text-sm md:text-base font-medium">
            {sub}
          </p>
        </div>
      </div>

      <ul className="mt-5 space-y-2 text-slate-700 text-sm md:text-base font-medium flex-1">
        {bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="text-emerald-700 font-bold">✓</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-5">
        <CTAButton href={ctaHref} variant={t.btn}>
          {ctaText}
        </CTAButton>

        {footerNote && (
          <p className="mt-3 text-[12px] md:text-sm text-slate-600 font-medium">
            {footerNote}
          </p>
        )}
      </div>
    </div>
  );
}
type Testi = { quote: string; name: string; meta: string };
const TESTIMONIALS: Testi[] = [
  {
    quote:
      "Sebelumnya anak saya selalu bilang ‘aku nggak bisa matematika’. Setelah rutin latihan, dia mulai pede dan nilai ulangan naik.",
    name: "Ibu Sinta",
    meta: "Orang tua murid • Kelas 4 SD",
  },
  {
    quote:
      "Yang paling saya suka: progress tersimpan. Jadi anak lanjut dari terakhir, saya juga bisa lihat skor dan bagian yang lemah.",
    name: "Ayah Bagas",
    meta: "Orang tua murid • Kelas 5 SD",
  },
  {
    quote:
      "Lebih hemat dibanding les offline, tapi tetap terarah karena ada try-out dan latihan bertahap. Anak jadi nggak cepat bosan.",
    name: "Bapak Sammy",
    meta: "Orang tua murid • Kelas 6 SD",
  },
  {
    quote:
      "Anak saya tipe mudah menyerah. Di sini belajarnya bertahap, jadi dia merasa ‘bisa’ dulu. Itu yang bikin dia mau lanjut.",
    name: "Ibu Rina",
    meta: "Orang tua murid • Kelas 3 SD",
  },
];

function TestimonialsSection() {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const items = useMemo(() => [...TESTIMONIALS, ...TESTIMONIALS], []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const speed = 0.6;
    let raf = 0;

    const loop = () => {
      track.scrollLeft += speed;
      if (track.scrollLeft >= track.scrollWidth / 2) track.scrollLeft = 0;
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section className="py-14 bg-emerald-50 border-y border-emerald-100">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="text-center">
          <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-emerald-200 text-emerald-800 text-xs md:text-sm font-bold">
            ⭐ Bukti Sosial
          </p>
          <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-slate-900">
            Orang Tua Bilang Efeknya Terasa
          </h2>
          <p className="mt-2 text-slate-600 text-sm md:text-lg max-w-2xl mx-auto font-medium">
            Bukan cuma “ngerjain soal”, tapi anak jadi lebih percaya diri dan
            konsisten belajar.
          </p>
        </div>

        <div className="mt-8 overflow-x-hidden" ref={trackRef}>
          <div className="flex gap-5 w-max pb-2">
            {items.map((t, i) => (
              <div
                key={i}
                className="min-w-[300px] max-w-[300px] md:min-w-[380px] md:max-w-[380px] bg-white rounded-2xl border border-emerald-200 p-6 shadow-sm"
              >
                <p className="text-amber-500 text-sm mb-2">★★★★★</p>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed font-medium">
                  “{t.quote}”
                </p>
                <div className="mt-4">
                  <p className="font-extrabold text-slate-900">{t.name}</p>
                  <p className="text-slate-600 text-sm font-medium">{t.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA after testimonials */}
        <div className="mt-10 bg-white border border-emerald-200 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="grid md:grid-cols-[1fr,0.9fr] gap-6 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                Mulai dari 4 soal gratis dulu.
              </h3>
              <p className="mt-2 text-slate-600 text-sm md:text-lg font-medium">
                Kalau anak cocok, baru upgrade. Tidak perlu Zoom. Belajar bisa
                kapan saja.
              </p>
              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                <CTAButton href="/latihan?src=testi" variant="primary">
                  👉 Coba 4 Soal Gratis
                </CTAButton>
                <CTAButton href="#pricing" variant="dark">
                  Lihat Paket & Benefit
                </CTAButton>
              </div>
              <p className="mt-3 text-[12px] text-slate-500">
                *Cocok SD & SMP. Progress otomatis tersimpan setelah upgrade.
              </p>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
              <Image
                src="/images/zoomboy.webp"
                width={1200}
                height={800}
                alt="Anak belajar dengan BeSmartKids"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PricingComparisonSection() {
  const WA = "https://wa.me/6285726321786";

  return (
    <>
      <section id="pricing" className="bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 py-16">
          <div className="text-center">
            <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs md:text-sm font-bold">
              ✅ Ringkas • Jelas • Ramah Kantong
            </p>

            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold text-slate-900">
              Pilih Paket yang Paling Cocok
            </h2>

            <p className="mt-3 text-slate-600 text-sm md:text-lg max-w-2xl mx-auto font-medium">
              Mulai dari{" "}
              <span className="font-bold text-slate-800">4 soal gratis</span>.
              Kalau cocok, upgrade untuk buka video, soal lebih banyak, try-out,
              dan PR (khusus Intensive).
            </p>
          </div>

          <div className="mt-10 grid lg:grid-cols-[1.05fr,1fr] gap-8 items-center">
            <div className="rounded-3xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
              <Image
                src="/images/zoomboy.webp"
                width={1600}
                height={1200}
                alt="Anak belajar matematika online"
                className="w-full h-full object-cover"
                priority
              />
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 md:p-7 shadow-sm">
              <h3 className="text-xl md:text-2xl font-extrabold text-slate-900">
                Benefit yang Orang Tua Paling Cari
              </h3>

              <div className="mt-4 grid gap-3 text-slate-700 text-sm md:text-base font-medium">
                {[
                  {
                    title: "Anak paham konsep, bukan sekadar hafal",
                    desc: "Ada ringkasan + video pembahasan. Anak bisa ulang kapan saja.",
                  },
                  {
                    title: "Progress tersimpan otomatis",
                    desc: "Anak lanjut dari terakhir. Orang tua bisa lihat skor & perkembangan.",
                  },
                  {
                    title: "Latihan bertahap (anti kaget)",
                    desc: "Soal disusun dari mudah → sedang → menantang supaya anak percaya diri.",
                  },
                  {
                    title: "Belajar fleksibel & hemat",
                    desc: "Tidak wajib Zoom. Fokus konsisten harian yang hasilnya terasa.",
                  },
                ].map((it) => (
                  <div
                    key={it.title}
                    className="bg-white border border-emerald-100 rounded-2xl p-4"
                  >
                    <p className="font-extrabold text-slate-900">
                      ✅ {it.title}
                    </p>
                    <p className="mt-1">{it.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <CTAButton href="/latihan?src=pricing" variant="primary">
                  👉 Coba 4 Soal Gratis
                </CTAButton>
                <CTAButton
                  href={`${WA}?text=Halo%20BeSmartKids,%20saya%20ingin%20tanya%20paket%20yang%20paling%20cocok%20untuk%20anak%20saya.`}
                  variant="dark"
                >
                  Tanya Admin (Opsional)
                </CTAButton>
              </div>
            </div>
          </div>

          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-5 gap-5 items-stretch">
            <PriceCard
              tone="slate"
              title="Free"
              price="Gratis"
              sub="Coba dulu — tanpa komitmen"
              bullets={[
                "Baca ringkasan materi",
                "Kerjakan soal 1–4",
                "Cocok untuk tes minat anak",
              ]}
              ctaText="Coba 4 Soal Gratis"
              ctaHref="/latihan?src=free"
            />

            <PriceCard
              tone="indigo"
              title="Belajar"
              price="Rp 129.000"
              sub="per bulan — rutin & terarah"
              bullets={[
                "Ringkasan + full video",
                "Soal 1–25 per materi",
                "Report skor + progress tersimpan",
                "Support chat standar",
              ]}
              ctaText="Pilih Paket Belajar"
              ctaHref={`${WA}?text=Halo%20BeSmartKids,%20saya%20ingin%20daftar%20Paket%20Belajar%20129rb%20per%20bulan.`}
            />

            <PriceCard
              tone="emerald"
              badge="⭐ Paling Laris"
              title="Premium"
              price="Rp 149.000"
              sub="per bulan — value terbaik"
              bullets={[
                "Semua fitur paket Belajar",
                "Soal 1–30 per materi",
                "Try-out 1×/bulan",
                "Badge Premium + support prioritas",
              ]}
              ctaText="Pilih Paket Premium"
              ctaHref={`${WA}?text=Halo%20BeSmartKids,%20saya%20ingin%20daftar%20Paket%20Premium%20149rb%20per%20bulan.`}
              highlight
              footerNote="Paling dipilih karena soal lebih banyak + try-out bulanan tanpa bikin budget bengkak."
            />

            <PriceCard
              tone="amber"
              title="Intensive"
              price="Rp 199.000"
              sub="per bulan — untuk anak yang butuh dorongan"
              bullets={[
                "Soal 1–40 per materi",
                "PR rutin 2 hari sekali",
                "Try-out mingguan",
                "Report paling detail + prioritas",
              ]}
              ctaText="Pilih Paket Intensive"
              ctaHref={`${WA}?text=Halo%20BeSmartKids,%20saya%20ingin%20daftar%20Paket%20Intensive%20199rb%20per%20bulan.`}
            />

            <PriceCard
              tone="violet"
              badge="💰 Hemat"
              title="3 Bulan"
              price="Rp 399.000"
              sub="sekali bayar — paling hemat"
              bullets={[
                "Soal 1–40 per materi",
                "Full video + progress",
                "Try-out lebih besar (2×)",
                "Support prioritas + badge 3-Month",
              ]}
              ctaText="Bundling 3 Bulan"
              ctaHref={`${WA}?text=Halo%20BeSmartKids,%20saya%20ingin%20ambil%20Bundling%203%20Bulan%20399rb.`}
            />
          </div>
        </div>
      </section>
      <TestimonialsSection />
    </>
  );
}
