"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

// ===================== TESTIMONIALS DATA =====================
const TESTIMONIALS = [
  {
    quote:
      "“Anak saya naik ranking setelah 3 bulan ikut BeSmartKids. Sebelumnya ia selalu berkata 'Aku nggak bisa Matematika', sekarang justru sering menunjukkan hasil ulangan dengan bangga. Bukan hanya paham, dia benar-benar jadi suka Matematika dan lebih percaya diri di kelas.”",
    name: "Ibu Sinta – Orang tua murid kelas 4 SD",
  },
  {
    quote:
      "“Nilai UTS naik 20 poin! Awalnya saya ragu, karena anak saya sering bosan kalau belajar online. Ternyata materi di BeSmartKids dibuat bertahap dan banyak contoh visual. Sekarang kalau jadwal Zoom, justru dia yang mengingatkan saya. Terima kasih BeSmartKids, efeknya terasa sekali di raport.”",
    name: "Ayah Bagas – Anak kelas 5 SD",
  },
  {
    quote:
      "“Anak saya dulu sangat pemalu dan tidak pernah berani bertanya di sekolah. Setelah ikut beberapa kali Zoom class, ia mulai mau menjawab pertanyaan guru, bahkan kadang menjelaskan ke temannya. Saya senang sekali melihat perubahan keberaniannya, bukan hanya nilainya.”",
    name: "Ibu Devi – Orang tua murid kelas 3 SD",
  },
  {
    quote:
      "“Gurunya sabar sekali. Anak saya tipe yang butuh penjelasan berulang-ulang. Di BeSmartKids, gurunya tidak pernah marah dan selalu menjelaskan dengan cara yang berbeda sampai anak saya paham. Sekarang mengerjakan PR tidak lagi penuh drama seperti dulu.”",
    name: "Ibu Rina – Anak kelas 2 SD",
  },
  {
    quote:
      "“Biasanya kalau pegang HP hanya untuk game dan YouTube. Sejak ikut BeSmartKids, anak saya punya jadwal khusus di HP untuk belajar. Dia senang karena tampilan websitenya menarik, dan saya senang karena waktu screentime sekarang ada manfaatnya.”",
    name: "Ibu Riris – Orang tua murid kelas 3 SD",
  },
  {
    quote:
      "“Kelas Zoom sangat membantu PR sekolah. Ketika ada materi yang saya sendiri lupa, guru BeSmartKids menjelaskan dengan sabar dan pelan-pelan. Saya merasa seperti punya tutor pribadi yang mengerti karakter anak saya.”",
    name: "Ayah Aldi – Anak kelas 6 SD",
  },
  {
    quote:
      "“Harganya jauh lebih murah dibanding les offline di sekitar rumah kami. Kalau dihitung dengan waktu dan biaya antar-jemput, BeSmartKids jauh lebih efisien. Anak tetap dapat pendampingan, kami orang tua tidak terlalu lelah, dan dompet juga aman.”",
    name: "Bapak Sammy – Orang tua murid kelas 5 SD",
  },
  {
    quote:
      "“Materinya lengkap dan enak dipahami. Ada soal dasar sampai yang menantang, sehingga anak saya tidak cepat bosan. Saya suka karena progresnya bisa dilihat, jadi tahu bagian mana yang perlu diulang lagi di rumah.”",
    name: "Ibu Clara – Orang tua murid kelas 4 SD",
  },
];

// ===================== TESTIMONIALS SECTION (AUTO-SCROLL) =====================

function TestimonialsSection() {
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Gandakan isi supaya bisa loop mulus
    const totalWidth = track.scrollWidth;
    let animationId: number;

    const speed = 0.5; // semakin besar, semakin cepat (pixel per frame)

    const loop = () => {
      if (!track) return;

      track.scrollLeft += speed;

      // kalau sudah lewat setengah konten, reset ke awal
      if (track.scrollLeft >= totalWidth / 2) {
        track.scrollLeft = 0;
      }

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationId);
  }, []);

  // konten digandakan 2x untuk efek infinite
  const items = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <section className="px-6 lg:px-12 py-16 bg-emerald-50 border-y border-emerald-100">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
          Apa Kata Orang Tua?
        </h2>
        <p className="text-center text-slate-600 mb-8 text-sm md:text-base max-w-2xl mx-auto">
          Cerita nyata dari orang tua yang melihat sendiri perubahan anak mereka
          — dari yang takut Matematika dan mudah menyerah, menjadi lebih tenang,
          berani, dan bangga dengan hasil belajarnya.
        </p>

        <div ref={trackRef} className="overflow-x-hidden">
          <div className="flex gap-4 pb-3 w-max">
            {items.map((item, i) => (
              <div
                key={i}
                className="min-w-[260px] max-w-[260px] md:min-w-[320px] md:max-w-[320px] bg-white rounded-2xl border border-emerald-100 p-4 shadow-sm text-xs md:text-sm text-slate-700"
              >
                <p className="text-amber-500 text-sm mb-1">★★★★★</p>
                <p className="mb-3 leading-relaxed">{item.quote}</p>
                <p className="font-semibold text-slate-900">{item.name}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-slate-500 mt-4 text-[11px] md:text-xs">
          (Tambahkan screenshot WhatsApp / foto anak belajar untuk meningkatkan
          kepercayaan lebih kuat lagi.)
        </p>
      </div>
    </section>
  );
}

// ===================== PAGE =====================
export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* TOP BAR TRUST */}
      <div className="w-full bg-slate-900 text-[11px] md:text-xs text-slate-100 py-2 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-1">
          <span>
            BeSmartKids — Bimbel Online & Offline untuk Anak SD Kelas 1–6
          </span>
          <span className="text-emerald-300">⭐ 4.9 / 5 • 100+ siswa</span>
        </div>
      </div>

      {/* HERO */}
      {/* HERO */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 pt-10 lg:pt-16 pb-16 grid lg:grid-cols-[1.15fr,1fr] gap-10 lg:gap-16 items-center">
          {/* LEFT TEXT */}
          <div className="order-2 lg:order-1">
            <div className="mb-5">
              <Image
                src="/images/logo_horizontal.png"
                width={500}
                height={500}
                alt="Anak belajar online dengan BeSmartKids"
                className="h-10 md:h-14 w-auto"
              />
            </div>

            <h1 className="text-3xl md:text-5xl font-bold leading-tight text-slate-900 mb-4">
              Bimbel Online & Offline untuk Anak SD{" "}
              <span className="text-emerald-600">Kelas 1–6</span>{" "}
              <span className="block mt-1">
                Belajar Jadi Lebih Mudah, Lebih Fun, dan Lebih Cepat Paham.
              </span>
            </h1>

            <p className="text-slate-600 text-base md:text-lg mb-6 leading-relaxed max-w-xl">
              BeSmartKids membantu anak memahami pelajaran sekolah dengan cepat
              melalui{" "}
              <span className="font-semibold text-slate-800">
                latihan soal interaktif, video penjelasan yang mudah dipahami,
              </span>{" "}
              dan{" "}
              <span className="font-semibold text-slate-800">
                kelas Zoom mingguan
              </span>{" "}
              bersama tutor ahli.
            </p>

            {/* BULLETS: 2 kolom di desktop supaya tidak kepanjangan ke bawah */}
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm md:text-base mb-6 text-slate-700">
              <p>
                😩{" "}
                <span className="font-semibold text-slate-900">
                  Anak malas belajar?
                </span>{" "}
                <span className="text-emerald-700">
                  Kami buat belajar jadi fun dengan tampilan yang anak-anak
                  sukai.
                </span>
              </p>
              <p>
                ⏰{" "}
                <span className="font-semibold text-slate-900">
                  Orang tua sibuk?
                </span>{" "}
                <span className="text-emerald-700">
                  Kami dampingi lewat latihan terstruktur dan kelas Zoom.
                </span>
              </p>
              <p>
                📉{" "}
                <span className="font-semibold text-slate-900">
                  Nilai anak turun?
                </span>{" "}
                <span className="text-emerald-700">
                  Kami pantau progres dan membantu mengulang materi yang belum
                  kuat.
                </span>
              </p>
              <p>
                ➗{" "}
                <span className="font-semibold text-slate-900">
                  Kesulitan Matematika?
                </span>{" "}
                <span className="text-emerald-700">
                  Latihan bertahap dari dasar, tidak langsung dilempar soal
                  sulit.
                </span>
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 items-start mb-3">
              <Link
                href="/auth/register"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-7 py-3 rounded-xl shadow-md text-sm md:text-base"
              >
                👉 Coba Gratis 7 Hari
              </Link>
              <Link
                href="https://wa.me/6285726321786?text=Halo%20BeSmartKids,%20saya%20ingin%20tanya%20tentang%20bimbel%20online%20dan%20offline%20untuk%20anak%20saya."
                target="_blank"
                className="bg-white border border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold px-7 py-3 rounded-xl text-sm md:text-base"
              >
                Tanya Admin via WhatsApp
              </Link>
            </div>

            <p className="text-[11px] md:text-xs text-slate-500 mb-4">
              Tanpa komitmen • Bisa berhenti kapan saja • Cocok untuk anak kelas
              1–6 SD
            </p>

            {/* Hero Promise */}
            <div className="inline-flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-[11px] md:text-xs text-slate-700">
              <span className="text-emerald-600 text-lg">✅</span>
              <span>
                <span className="font-semibold text-emerald-700">
                  95% siswa kami mengalami peningkatan kemampuan
                </span>{" "}
                setelah 2 bulan belajar secara konsisten.*
              </span>
            </div>
          </div>

          {/* RIGHT IMAGE + TEXT CARD */}
          <div className="order-1 lg:order-2">
            <div className="relative rounded-3xl overflow-hidden shadow-xl bg-slate-100">
              <Image
                src="/images/zoomboy.webp"
                width={1500}
                height={1500}
                alt="Anak belajar online dengan BeSmartKids"
                className="w-full h-full object-cover"
              />
            </div>

            {/* caption di bawah gambar supaya kolom kanan tidak kosong */}
            <div className="mt-4 bg-white border border-emerald-100 rounded-2xl px-4 py-3 shadow-sm text-xs md:text-sm text-slate-700">
              <p className="font-semibold text-slate-900 mb-1">
                Live Zoom Class bersama tutor BeSmartKids
              </p>
              <p>
                Anak belajar dari rumah dengan pendampingan langsung, bisa
                bertanya kapan saja, dan tetap merasa seperti berada di kelas
                sungguhan.
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] md:text-xs text-emerald-700 font-semibold">
                <span className="px-2 py-1 bg-emerald-50 rounded-full">
                  2–8x Zoom / bulan
                </span>
                <span className="px-2 py-1 bg-emerald-50 rounded-full">
                  Kelompok kecil, perhatian maksimal
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 – PROBLEM / PAIN */}

      <section className="px-6 lg:px-12 py-14 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Kenapa Banyak Anak Sulit Belajar di Sekolah?
          </h2>
          <p className="text-center text-slate-600 mb-8 max-w-2xl mx-auto text-sm md:text-base">
            Jika anak Anda mengalami hal ini, Anda tidak sendirian. Sistem
            belajar di sekolah tidak selalu bisa menyesuaikan kebutuhan setiap
            anak.
          </p>

          <div className="grid md:grid-cols-3 gap-5 text-sm md:text-base">
            {[
              "Pelajaran semakin sulit setiap kelas naik.",
              "Guru sekolah tidak bisa fokus satu per satu.",
              "Banyak anak takut matematika dan malu bertanya.",
              "Orang tua tidak punya waktu dampingi belajar setiap hari.",
              "Anak mudah bosan jika hanya baca buku atau dengar ceramah.",
              "Les offline mahal & makan waktu perjalanan.",
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>

          <p className="text-center text-slate-600 mt-8 text-xs md:text-sm">
            Ini bukan salah anak Anda. Banyak anak membutuhkan cara belajar yang
            berbeda — yang lebih visual, interaktif, dan menyenangkan.
          </p>
        </div>
      </section>

      {/* SECTION 3 – VALUE PROPOSITION / SOLUSI */}
      <section className="px-6 lg:px-12 py-16 max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
          Solusi Belajar Modern yang Disukai Anak & Dipercaya Orang Tua
        </h2>
        <p className="text-center text-slate-600 mb-10 max-w-2xl mx-auto text-sm md:text-base">
          BeSmartKids menggabungkan teknologi dan psikologi belajar anak agar
          proses belajar terasa ringan, tapi hasilnya tetap kuat.
        </p>

        <div className="grid md:grid-cols-3 gap-6 text-sm md:text-base">
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-6 shadow-sm">
            <div className="text-2xl mb-2">💻</div>
            <h3 className="font-semibold text-lg mb-2 text-emerald-800">
              Bimbel Online Interaktif
            </h3>
            <ul className="space-y-1 text-slate-700 text-sm">
              <li>• Website gamified & fun.</li>
              <li>• Soal bertingkat → anak belajar bertahap.</li>
              <li>• Progress tercatat otomatis.</li>
            </ul>
          </div>

          <div className="rounded-xl bg-sky-50 border border-sky-100 p-6 shadow-sm">
            <div className="text-2xl mb-2">🧑‍🏫</div>
            <h3 className="font-semibold text-lg mb-2 text-sky-800">
              Zoom Class dengan Guru Ahli
            </h3>
            <ul className="space-y-1 text-slate-700 text-sm">
              <li>• 2x per minggu (atau sesuai paket).</li>
              <li>• Fokus pada pemahaman konsep, bukan hafalan.</li>
              <li>• Grup kecil → perhatian maksimal.</li>
            </ul>
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-100 p-6 shadow-sm">
            <div className="text-2xl mb-2">🎥</div>
            <h3 className="font-semibold text-lg mb-2 text-amber-800">
              Video Penjelasan Mudah Dipahami
            </h3>
            <ul className="space-y-1 text-slate-700 text-sm">
              <li>• Durasi pendek, tidak membosankan.</li>
              <li>• Bahasa anak-anak SD, kelas 1–6.</li>
              <li>• Contoh visual yang dekat dengan kehidupan sehari-hari.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 4 – WHAT THEY GET / BENEFIT GRID */}
      <section className="px-6 lg:px-12 py-16 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Anak Tidak Hanya Mengerjakan Soal — Mereka Memahami Konsepnya.
          </h2>
          <p className="text-center text-slate-600 mb-8 max-w-2xl mx-auto text-sm md:text-base">
            Setiap fitur di BeSmartKids dirancang untuk membangun pemahaman
            jangka panjang, bukan hafalan sesaat.
          </p>

          <div className="grid md:grid-cols-4 gap-4 text-xs md:text-sm">
            {[
              "Soal gratis setiap materi.",
              "Soal premium untuk latihan lebih dalam.",
              "Report progress siswa yang rapi.",
              "Rekomendasi materi berdasarkan kemampuan.",
              "Video pembahasan tiap topik.",
              "Bank soal besar yang terus bertambah.",
              "Challenge harian (coming soon).",
              "Konten fun & visual untuk menjaga fokus.",
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-200 p-4 text-slate-700 shadow-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7 – PROGRAM & PRICING */}
      <section className="px-6 lg:px-12 py-16 max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
          Pilih Program Terbaik Untuk Anak Anda
        </h2>
        <p className="text-center text-slate-600 mb-10 text-sm md:text-base max-w-2xl mx-auto">
          Semua program dapat diakses langsung dari rumah tanpa antar jemput.
          Tinggal pilih paket yang paling cocok untuk cara belajar anak.
        </p>

        <div className="grid md:grid-cols-4 gap-6 text-sm md:text-base">
          {/* Free */}
          <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm flex flex-col">
            <p className="text-xs font-semibold text-slate-500 mb-1 uppercase">
              Paket Free
            </p>
            <h3 className="font-bold text-lg mb-2 text-slate-900">Coba Dulu</h3>
            <p className="text-2xl font-bold text-emerald-600 mb-4">Gratis</p>

            <ul className="text-sm text-slate-700 space-y-1 flex-1">
              <li>• 8 soal per materi.</li>
              <li>• Akses materi dasar.</li>
              <li>• Tanpa kartu kredit / komitmen.</li>
              <li>• Cocok untuk memulai.</li>
            </ul>

            <Link
              href="/auth/register"
              className="mt-4 w-full text-center border border-emerald-600 text-emerald-700 hover:bg-emerald-50 rounded-xl py-2 font-semibold text-sm"
            >
              Coba Gratis
            </Link>
          </div>

          {/* Weekly Zoom */}
          <div className="border-2 border-emerald-500 rounded-2xl p-6 bg-emerald-50 shadow-md flex flex-col">
            <p className="text-xs font-semibold text-emerald-700 mb-1 uppercase">
              Paling Direkomendasikan
            </p>
            <h3 className="font-bold text-lg mb-2 text-slate-900">
              Premium Weekly
            </h3>
            <p className="text-2xl font-bold text-emerald-700 mb-1">
              Rp 199.000
              <span className="text-sm font-normal text-slate-700">
                {" "}
                / minggu
              </span>
            </p>

            <ul className="text-sm text-slate-700 space-y-1 flex-1">
              <li>• Semua materi & soal tanpa batas.</li>
              <li>• Zoom class 2x per minggu.</li>
              <li>• Feedback tutor langsung.</li>
              <li>• Cocok intensif persiapan ujian.</li>
            </ul>

            <Link
              href="https://wa.me/6285726321786?text=Halo%20BesmartKids,%20saya%20ingin%20daftar%20Premium%20Weekly."
              target="_blank"
              className="mt-4 w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2 font-semibold text-sm"
            >
              Daftar Premium Weekly
            </Link>
          </div>

          {/* Monthly Zoom */}
          <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm flex flex-col">
            <p className="text-xs font-semibold text-slate-500 mb-1 uppercase">
              Belajar Rutin
            </p>
            <h3 className="font-bold text-lg mb-2 text-slate-900">
              Premium Monthly
            </h3>
            <p className="text-2xl font-bold text-emerald-600 mb-1">
              Rp 599.000
              <span className="text-sm font-normal text-slate-700">
                {" "}
                / bulan
              </span>
            </p>

            <ul className="text-sm text-slate-700 space-y-1 flex-1">
              <li>• Semua fitur Premium Weekly.</li>
              <li>• Zoom 8x per bulan.</li>
              <li>• Pola belajar stabil & terarah.</li>
            </ul>

            <Link
              href="https://wa.me/6285726321786?text=Halo%20BesmartKids,%20saya%20ingin%20daftar%20Premium%20Monthly."
              target="_blank"
              className="mt-4 w-full text-center border border-emerald-600 text-emerald-700 hover:bg-emerald-50 rounded-xl py-2 font-semibold text-sm"
            >
              Daftar Premium Monthly
            </Link>
          </div>

          {/* Website Premium Only */}
          <div className="border border-amber-400 rounded-2xl p-6 bg-amber-50 shadow-sm flex flex-col">
            <p className="text-xs font-semibold text-amber-700 mb-1 uppercase">
              Website Premium Only
            </p>
            <h3 className="font-bold text-lg mb-2 text-slate-900">
              Tanpa Zoom – Per Bulan
            </h3>

            <p className="text-2xl font-bold text-amber-600 mb-1">
              Rp 149.000
              <span className="text-sm font-normal text-slate-700">
                {" "}
                / bulan
              </span>
            </p>

            <ul className="text-sm text-slate-700 space-y-1 flex-1">
              <li>• Akses penuh semua soal & materi premium.</li>
              <li>• Tanpa Zoom — bebas belajar kapan pun.</li>
              <li>• Cocok untuk anak mandiri.</li>
              <li>• Progres otomatis tersimpan.</li>
            </ul>

            <Link
              href="https://wa.me/6285726321786?text=Halo%20BeSmartKids,%20saya%20ingin%20daftar%20Website%20Premium%20149rb%20per%20bulan."
              target="_blank"
              className="mt-4 w-full text-center bg-amber-500 hover:bg-amber-600 text-white rounded-xl py-2 font-semibold text-sm"
            >
              Daftar Premium Website
            </Link>
          </div>
        </div>

        <p className="text-center text-slate-600 mt-6 text-xs md:text-sm max-w-2xl mx-auto">
          Anda bisa memilih paket dengan Zoom jika anak membutuhkan pendampingan
          langsung, atau memilih Website Premium untuk latihan mandiri lebih
          hemat setiap bulan.
        </p>
      </section>

      {/* TESTIMONIALS SECTION (AUTO SCROLL) */}
      <TestimonialsSection />

      {/* BRAND STORY */}
      <section className="px-6 lg:px-12 py-16 max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center">
          Kenapa Kami Membangun BeSmartKids?
        </h2>
        <div className="bg-slate-900 text-slate-50 rounded-3xl p-6 md:p-8 shadow-xl text-sm md:text-base space-y-3">
          <p>
            Founder BeSmartKids adalah guru matematika & mentor coding anak
            dengan pengalaman lebih dari 6 tahun mengajar ratusan siswa secara
            online dan offline.
          </p>
          <p>
            Lebih dari{" "}
            <span className="font-semibold text-emerald-300">100 siswa</span>{" "}
            telah dibimbing langsung, mulai dari anak yang sangat takut
            matematika sampai yang ingin persiapan olimpiade.
          </p>
          <p>
            Kami percaya semua anak bisa pintar jika metodenya tepat dan
            suasananya nyaman. Karena itu, BeSmartKids tidak hanya fokus pada
            nilai, tapi juga{" "}
            <span className="font-semibold text-emerald-300">
              rasa percaya diri
            </span>{" "}
            dan{" "}
            <span className="font-semibold text-emerald-300">
              kebiasaan belajar yang baik.
            </span>
          </p>
        </div>
      </section>

      {/* GUARANTEE */}
      <section className="px-6 lg:px-12 py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Tanpa Risiko untuk Mencoba
          </h2>
          <p className="text-slate-600 text-sm md:text-base mb-5">
            Coba gratis 3 hari tanpa bayar. Jika anak tidak cocok, Anda bisa
            berhenti kapan saja. Tidak ada kontrak, tidak ada komitmen jangka
            panjang.
          </p>
          <ul className="text-sm md:text-base text-slate-700 space-y-1 mb-5">
            <li>• Coba gratis 3 hari tanpa bayar.</li>
            <li>• Jika anak tidak cocok, tinggal stop kapan saja.</li>
            <li>• No commitment, no risiko.</li>
          </ul>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 lg:px-12 py-16 max-w-5xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">
          Bantu Anak Belajar Lebih Mudah Mulai Hari Ini.
        </h2>
        <p className="text-slate-600 text-sm md:text-base mb-6 max-w-2xl mx-auto">
          Jangan tunggu nilai turun lagi. Mulai dari satu klik hari ini —
          perubahan bisa Anda lihat beberapa minggu ke depan.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-3">
          <Link
            href="/auth/register"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3 rounded-xl shadow-md text-sm md:text-base"
          >
            👉 Daftar Gratis
          </Link>
          <Link
            href="https://wa.me/6285726321786?text=Halo%20BeSmartKids,%20saya%20ingin%20konsultasi%20tentang%20bimbel%20online%20dan%20offline."
            target="_blank"
            className="bg-white border border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold px-6 py-3 rounded-xl text-sm md:text-base"
          >
            Tanya Admin via WhatsApp
          </Link>
        </div>

        <p className="text-[11px] md:text-xs text-slate-500">
          Untuk anak SD kelas 1–6 • Online & offline • Bisa mulai dari satu
          materi dulu.
        </p>
      </section>

      {/* FOOTER */}
      <footer className="px-6 lg:px-12 pb-6 border-t text-[11px] md:text-xs text-slate-500 text-center">
        © {new Date().getFullYear()} BeSmartKids — Bimbel Online & Offline SD
        Kelas 1–6.
      </footer>
    </main>
  );
}
