"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import MathText from "@/app/components/MathText";
import { trackMetaCustomEvent } from "@/lib/meta-pixel";

type CategoryScore = {
  category: string;
  score: number;
  correct: number;
  total: number;
};
type Attempt = {
  id: string;
  student_name: string;
  parent_whatsapp: string;
  grade_level: number;
  concern?: string | null;
  score: number;
  result_level: string;
  completed_at?: string | null;
};
type Profile = {
  level: string;
  tone: string;
  summary: string;
  recommendation: string[];
};
type Answer = {
  question_id: string;
  prompt: string;
  selected_answer: string | null;
  correct_answer: string;
  category: string;
  is_correct: boolean;
  explanation: string;
};
type TabKey =
  | "summary"
  | "analysis"
  | "recommendation"
  | "comparison"
  | "history";

function formatName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

function levelLabel(score: number) {
  if (score >= 85) return "Sangat Baik";
  if (score >= 70) return "Baik";
  if (score >= 55) return "Cukup";
  return "Perlu Latihan";
}

function levelClass(score: number) {
  if (score >= 85) return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (score >= 70) return "bg-green-50 text-green-700 border-green-100";
  if (score >= 55) return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-red-50 text-red-700 border-red-100";
}

function categoryNarrative(category: string, score: number) {
  const base: Record<
    string,
    { strength: string; gap: string; action: string; besmart: string }
  > = {
    "Pemahaman Bilangan": {
      strength:
        "Anak mulai mampu membaca hubungan antarbilangan dan memahami nilai suatu bilangan dalam konteks sederhana.",
      gap: "Jika bagian ini rendah, biasanya anak belum stabil saat membandingkan bilangan, melihat pola nilai tempat, atau memahami makna angka dalam soal.",
      action:
        "Latihan terbaik adalah permainan nilai tempat, mengurutkan bilangan, membandingkan jumlah benda, dan menjelaskan alasan mengapa sebuah bilangan lebih besar atau lebih kecil.",
      besmart:
        "Di BeSmartKids, anak akan dibantu membangun rasa angka melalui visual, cerita pendek, dan latihan bertahap agar tidak hanya hafal urutan angka, tetapi paham maknanya.",
    },
    "Kelancaran Berhitung": {
      strength:
        "Anak memiliki modal penting untuk menyelesaikan operasi hitung dengan lebih cepat dan percaya diri.",
      gap: "Jika skornya belum tinggi, anak mungkin masih membutuhkan waktu lama, mudah tertukar langkah, atau belum otomatis pada operasi dasar.",
      action:
        "Fokuskan latihan pada strategi berhitung, bukan sekadar mengejar banyak soal. Gunakan pola 10, pasangan bilangan, perkalian bertahap, dan cek ulang hasil.",
      besmart:
        "Di BeSmartKids, latihan hitung dibuat pendek tetapi konsisten, dengan pembahasan cara berpikir agar anak tahu mengapa jawabannya benar.",
    },
    Pecahan: {
      strength:
        "Anak mulai mengenali bagian dari keseluruhan dan hubungan sederhana antarpecahan.",
      gap: "Pecahan sering terasa abstrak. Kesalahan biasanya muncul saat membandingkan pecahan, mencari pecahan senilai, atau mengubah bentuk pecahan dalam soal cerita.",
      action:
        "Gunakan gambar potongan kue, garis bilangan, dan benda konkret sebelum masuk ke rumus. Anak perlu melihat bahwa pecahan adalah nilai, bukan hanya dua angka yang dipisahkan garis.",
      besmart:
        "Di BeSmartKids, pecahan diajarkan dari visual menuju simbol sehingga anak tidak cepat bingung saat bentuk soalnya berubah.",
    },
    "Soal Cerita": {
      strength:
        "Anak mulai mampu menghubungkan matematika dengan situasi sehari-hari.",
      gap: "Jika bagian ini rendah, masalah utamanya sering bukan hitungan, tetapi memahami informasi penting, memilih operasi yang tepat, dan menyusun langkah penyelesaian.",
      action:
        "Latih anak menandai informasi penting, menulis apa yang ditanyakan, lalu memilih operasi. Jangan langsung meminta jawaban akhir sebelum alurnya jelas.",
      besmart:
        "Di BeSmartKids, soal cerita dibahas dengan metode baca-pahami-rencanakan-selesaikan agar anak terbiasa berpikir runtut.",
    },
    "Penalaran Logis": {
      strength:
        "Anak menunjukkan kemampuan melihat pola, hubungan, dan aturan tersembunyi dalam soal.",
      gap: "Jika nilainya rendah, anak mungkin masih terburu-buru menebak jawaban tanpa mencari aturan atau hubungan antarangka.",
      action:
        "Berikan latihan pola, teka-teki angka, dan soal sebab-akibat. Minta anak menjelaskan alasan, bukan hanya menyebut jawaban.",
      besmart:
        "Di BeSmartKids, penalaran dilatih dengan soal bertahap agar anak berani mencoba strategi dan tidak takut pada soal yang berbeda dari contoh.",
    },
  };
  const fallback = base[category] ?? base["Soal Cerita"];
  if (score >= 80) {
    return {
      title: `${category} sudah menjadi kekuatan utama`,
      message: `${fallback.strength} Bagian ini bisa dipakai sebagai pijakan untuk masuk ke soal yang lebih menantang. Tantangan berikutnya adalah menjaga ketelitian dan melatih anak menjelaskan langkahnya dengan bahasa sendiri.`,
      action: `Berikan variasi soal HOTS ringan pada topik ${category}, terutama soal yang meminta alasan dan bukan hanya hasil akhir. ${fallback.besmart}`,
    };
  }
  if (score >= 60) {
    return {
      title: `${category} sudah cukup, tetapi belum stabil`,
      message: `${fallback.strength} Namun hasilnya menunjukkan pemahaman anak masih perlu dibuat lebih konsisten. Pada kondisi ini, anak biasanya bisa mengerjakan soal yang mirip contoh, tetapi mulai ragu saat angka atau bentuk soal berubah.`,
      action: `${fallback.action} ${fallback.besmart}`,
    };
  }
  return {
    title: `${category} perlu menjadi fokus utama`,
    message: `${fallback.gap} Ini bukan berarti anak tidak mampu. Biasanya anak hanya belum mendapat urutan belajar yang cukup jelas atau belum cukup sering melihat contoh dari bentuk konkret ke bentuk soal.`,
    action: `${fallback.action} ${fallback.besmart}`,
  };
}

function buildSummary(
  studentName: string,
  score: number,
  strongest: CategoryScore[],
  weakest: CategoryScore[],
) {
  const strengthText = strongest
    .map((item) => `${item.category} (${item.score}%)`)
    .join(" dan ");
  const weakText = weakest
    .map((item) => `${item.category} (${item.score}%)`)
    .join(" dan ");
  if (score >= 80) {
    return `${studentName} menunjukkan kesiapan matematika yang kuat. Kekuatan paling menonjol terlihat pada ${strengthText}. Ini modal yang sangat baik karena anak sudah punya dasar untuk masuk ke soal yang lebih menantang. Bagian yang tetap perlu dijaga adalah ${weakText}, supaya kemampuan anak tidak hanya tinggi di satu jenis soal, tetapi merata. Dengan pendampingan BeSmartKids, anak bisa diarahkan ke latihan penalaran, soal cerita bertahap, dan tantangan HOTS yang membuat kemampuan berpikirnya berkembang lebih jauh.`;
  }
  if (score >= 60) {
    return `${studentName} sudah memiliki fondasi yang cukup baik, terutama pada ${strengthText}. Artinya anak punya kemampuan yang bisa dikembangkan, tetapi masih membutuhkan latihan yang lebih terarah pada ${weakText}. Pada tahap ini, target utamanya bukan memberi soal sebanyak mungkin, melainkan membuat anak paham pola soal, tahu langkah penyelesaian, dan lebih percaya diri ketika bentuk soal berubah. BeSmartKids dapat membantu menyusun latihan bertahap agar kekuatan anak tetap terpakai, sementara bagian yang lemah diperbaiki pelan-pelan.`;
  }
  return `${studentName} masih membutuhkan penguatan fondasi secara bertahap. Kekuatan awal yang bisa dijadikan pegangan terlihat pada ${strengthText}, sedangkan bagian yang paling perlu diperhatikan adalah ${weakText}. Hasil seperti ini bukan alasan untuk membuat anak merasa gagal. Justru ini memberi arah yang jelas: mulai dari konsep yang paling dasar, gunakan visual dan contoh konkret, lalu naik perlahan ke soal yang lebih kompleks. Di BeSmartKids, anak dapat dibimbing dengan ritme belajar yang lebih aman, sehingga rasa percaya diri tumbuh bersama pemahamannya.`;
}

function DonutScore({ score }: { score: number }) {
  const angle = Math.max(0, Math.min(100, score)) * 3.6;
  return (
    <div
      className="relative mx-auto flex h-44 w-44 items-center justify-center rounded-full shadow-[inset_0_6px_18px_rgba(255,255,255,0.55),0_20px_45px_-32px_rgba(15,23,42,0.9)] sm:h-56 sm:w-56"
      style={{
        background: `conic-gradient(#2f9b5f ${angle}deg, #e8edf4 0deg)`,
      }}
    >
      <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white shadow-inner sm:h-36 sm:w-36">
        <span className="text-4xl font-black text-[#102449] sm:text-5xl">
          {score}%
        </span>
        <span className="text-sm font-bold text-slate-500">Persentase</span>
      </div>
    </div>
  );
}

function TopTabs({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}) {
  const tabs: Array<[TabKey, string]> = [
    ["summary", "Ringkasan"],
    ["analysis", "Analisis Detail"],
    ["recommendation", "Rekomendasi"],
    ["comparison", "Perbandingan"],
    ["history", "Riwayat"],
  ];
  return (
    <div className="flex max-w-full gap-2 overflow-x-auto border-b border-slate-200 bg-slate-50 p-2 text-center text-[11px] font-black text-slate-500 [-webkit-overflow-scrolling:touch] sm:grid sm:grid-cols-5 sm:gap-0 sm:overflow-visible sm:bg-white sm:p-0 sm:text-xs">
      {tabs.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`shrink-0 whitespace-nowrap border px-4 py-3 transition hover:bg-blue-50 hover:text-blue-700 sm:border-0 sm:px-2 sm:py-4 ${active === key ? "border-blue-600 bg-blue-600 text-white shadow-[0_12px_28px_-20px_rgba(37,99,235,0.9)] sm:border-b-2 sm:bg-blue-50 sm:text-blue-700 sm:shadow-none" : "border-slate-200 bg-white sm:bg-transparent"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function MathCheckupResultClient({
  attemptId,
}: {
  attemptId: string;
}) {
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categoryScores, setCategoryScores] = useState<CategoryScore[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("summary");
  const [selectedAnswer, setSelectedAnswer] = useState<Answer | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const viewResultTracked = useRef(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch(`/api/diagnostic/result/${attemptId}`);
        const data = (await response.json()) as {
          ok?: boolean;
          attempt?: Attempt;
          profile?: Profile;
          categoryScores?: CategoryScore[];
          answers?: Answer[];
          error?: string;
        };
        if (!response.ok || !data.ok)
          throw new Error(data.error ?? "Gagal memuat hasil.");
        if (!active) return;
        setAttempt(data.attempt ?? null);
        setProfile(data.profile ?? null);
        setCategoryScores(data.categoryScores ?? []);
        setAnswers(data.answers ?? []);
      } catch (err) {
        if (active) setError((err as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [attemptId]);

  useEffect(() => {
    /*
     * Jangan hitung ViewResult sebelum laporan
     * benar-benar berhasil dimuat.
     */
    if (loading || !attempt || !profile) return;

    /*
     * Proteksi dalam lifecycle component.
     */
    if (viewResultTracked.current) return;

    const storageKey = `meta_view_result_${attemptId}`;

    try {
      /*
       * Kalau attempt ini pernah dilihat sebelumnya,
       * jangan kirim ViewResult lagi.
       */
      if (localStorage.getItem(storageKey)) {
        viewResultTracked.current = true;
        return;
      }

      viewResultTracked.current = true;

      trackMetaCustomEvent("ViewResult", {
        content_name: "Math Checkup Result",
        diagnostic_type: "math_checkup",
      });

      localStorage.setItem(storageKey, "1");
    } catch {
      /*
       * Fallback kalau localStorage tidak tersedia.
       */
      viewResultTracked.current = true;

      trackMetaCustomEvent("ViewResult", {
        content_name: "Math Checkup Result",
        diagnostic_type: "math_checkup",
      });
    }
  }, [attemptId, attempt, profile, loading]);

  const lowestCategories = useMemo(
    () => [...categoryScores].sort((a, b) => a.score - b.score).slice(0, 2),
    [categoryScores],
  );
  const strongestCategories = useMemo(
    () => [...categoryScores].sort((a, b) => b.score - a.score).slice(0, 2),
    [categoryScores],
  );
  const totalCorrect = categoryScores.reduce(
    (sum, item) => sum + item.correct,
    0,
  );
  const totalQuestions = categoryScores.reduce(
    (sum, item) => sum + item.total,
    0,
  );
  const displayName = attempt ? formatName(attempt.student_name) : "";
  const richSummary = attempt
    ? buildSummary(
        displayName,
        Number(attempt.score ?? 0),
        strongestCategories,
        lowestCategories,
      )
    : "";
  const focusRecommendations = [
    ...lowestCategories,
    ...categoryScores.filter(
      (item) =>
        item.score < 75 &&
        !lowestCategories.some((low) => low.category === item.category),
    ),
  ].slice(0, 3);

  if (loading)
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] font-black text-blue-700">
        Menyusun laporan...
      </main>
    );
  if (error || !attempt || !profile)
    return (
      <main className="flex min-h-screen items-center justify-center bg-red-50 p-4 text-center font-bold text-red-700">
        {error ?? "Hasil tidak tersedia."}
      </main>
    );

  const waMessage = encodeURIComponent(
    `Halo BeSmartKids, saya ingin konsultasi hasil cek matematika ${displayName} kelas ${attempt.grade_level}. Skornya ${attempt.score}/100 (${profile.level}).`,
  );
  const whatsappHref = `https://wa.me/${attempt.parent_whatsapp}?text=${waMessage}`;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dff7e8_0,#f4f7fb_32%,#f7fbff_100%)] text-[#102449]">
      <header className="bg-[#123a82] px-4 py-3 text-white shadow-sm sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center">
            <img
              src="/images/logo_horizontal.png"
              alt="BeSmartKids"
              className="h-9 w-auto rounded bg-white/95 px-2 py-1 object-contain"
            />
          </div>
          <div className="text-sm font-black">Hasil Math Check-Up</div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl overflow-hidden px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
        <section className="overflow-hidden border border-slate-200 bg-white shadow-[0_22px_70px_-56px_rgba(15,23,42,0.85)]">
          <div className="bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-5 sm:p-7">
            <div className="text-center">
              <h1 className="text-2xl font-black text-blue-700">Selamat!</h1>
              <p className="mt-2 text-base font-semibold leading-relaxed text-slate-700">
                {displayName} telah menyelesaikan Math Check-Up Kelas{" "}
                {attempt.grade_level}.
              </p>
            </div>

            <div className="mt-6 grid gap-5 border border-blue-100 bg-white/95 p-5 shadow-[0_18px_55px_-42px_rgba(15,23,42,0.75)] lg:grid-cols-[1fr_1fr]">
              <div className="flex flex-col items-center justify-center border-b border-slate-200 pb-5 text-center lg:items-start lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8 lg:text-left">
                <p className="text-sm font-black text-[#102449]">Skor Total</p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-5xl font-black leading-none text-[#102449] sm:text-6xl">
                    {attempt.score}
                  </span>
                  <span className="pb-2 text-xl font-bold text-[#102449]">
                    /100
                  </span>
                </div>
                <p className="mt-5 text-sm font-black text-slate-500">
                  Kategori
                </p>
                <span
                  className={`mt-2 w-fit border px-5 py-2 text-sm font-black ${levelClass(attempt.score)}`}
                >
                  {levelLabel(attempt.score)}
                </span>
              </div>
              <DonutScore score={Number(attempt.score ?? 0)} />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setActiveTab("analysis")}
                className="border border-blue-200 bg-white px-5 py-4 text-center font-black text-blue-700 hover:bg-blue-50"
              >
                Lihat Laporan Lengkap
              </button>
              <Link
                href={`/math-checkup/result/${attemptId}/pdf`}
                className="border border-emerald-200 bg-emerald-50 px-5 py-4 text-center font-black text-emerald-700 hover:bg-emerald-100"
              >
                Download PDF
              </Link>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="bg-blue-600 px-5 py-4 text-center font-black text-white shadow-[0_16px_42px_-30px_rgba(37,99,235,0.95)] hover:bg-[#123a82]"
              >
                Konsultasi Hasil
              </a>
            </div>
            <div className="mt-7">
              <h2 className="text-lg font-black">Ringkasan Kemampuan</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {categoryScores.map((item, index) => (
                  <div
                    key={item.category}
                    className={`min-w-0 border bg-white p-3 text-center shadow-sm sm:p-4 ${index === 0 ? "border-emerald-200" : index === 1 || index === 4 ? "border-amber-200" : "border-slate-200"}`}
                  >
                    <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-sm font-black text-blue-700">
                      {index + 1}
                    </div>
                    <p className="mt-3 min-h-8 break-words text-[11px] font-black leading-tight text-slate-600 sm:text-xs">
                      {item.category}
                    </p>
                    <p className="mt-1 text-2xl font-black text-[#102449] sm:text-3xl">
                      {item.score}
                    </p>
                    <span
                      className={`mt-2 inline-flex border px-3 py-1 text-[11px] font-black ${levelClass(item.score)}`}
                    >
                      {levelLabel(item.score)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="laporan-lengkap"
          className="mt-5 border border-slate-200 bg-white shadow-sm"
        >
          <header className="bg-[#123a82] px-4 py-3 text-center text-sm font-black text-white">
            Laporan Lengkap - Kelas {attempt.grade_level}
          </header>
          <TopTabs active={activeTab} onChange={setActiveTab} />
          <div className="min-w-0 p-4 sm:p-7">
            {activeTab === "summary" && (
              <div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                      Ringkasan Utama
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-[#102449]">
                      Peta Awal Kemampuan Anak
                    </h2>
                  </div>
                  <span
                    className={`w-fit border px-4 py-2 text-sm font-black ${levelClass(attempt.score)}`}
                  >
                    {levelLabel(attempt.score)}
                  </span>
                </div>

                <div className="mt-5 border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-5 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.65)]">
                  <p className="max-w-3xl text-xl font-black leading-snug text-[#102449]">
                    {displayName} memiliki modal belajar pada{" "}
                    {strongestCategories
                      .map((item) => item.category)
                      .join(" dan ")}
                    , dengan fokus penguatan berikutnya pada{" "}
                    {lowestCategories
                      .map((item) => item.category)
                      .join(" dan ")}
                    .
                  </p>
                  <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-700">
                    Hasil ini bukan label kemampuan anak, melainkan peta awal
                    untuk menentukan cara belajar yang paling tepat, lebih
                    terarah, dan tidak membuat anak merasa tertinggal.
                  </p>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-3">
                  <div className="border border-emerald-100 bg-emerald-50 p-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">
                        1
                      </span>
                      <p className="text-base font-black text-emerald-800">
                        Kekuatan Anak
                      </p>
                    </div>
                    <div className="mt-4 space-y-3">
                      {strongestCategories.map((item) => (
                        <div
                          key={item.category}
                          className="border border-emerald-100 bg-white/80 p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-black text-slate-800">
                              {item.category}
                            </span>
                            <span className="text-sm font-black text-emerald-700">
                              {item.score}%
                            </span>
                          </div>
                          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
                            Bisa dijadikan pijakan untuk membangun percaya diri
                            dan masuk ke soal yang lebih menantang.
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border border-amber-100 bg-amber-50 p-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-sm font-black text-white">
                        2
                      </span>
                      <p className="text-base font-black text-amber-800">
                        Perlu Dikuatkan
                      </p>
                    </div>
                    <div className="mt-4 space-y-3">
                      {lowestCategories.map((item) => (
                        <div
                          key={item.category}
                          className="border border-amber-100 bg-white/80 p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-black text-slate-800">
                              {item.category}
                            </span>
                            <span className="text-sm font-black text-amber-700">
                              {item.score}%
                            </span>
                          </div>
                          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
                            Perlu latihan bertahap agar anak memahami langkah,
                            bukan hanya menghafal jawaban.
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border border-blue-100 bg-blue-50 p-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">
                        3
                      </span>
                      <p className="text-base font-black text-blue-800">
                        Arah Belajar
                      </p>
                    </div>
                    <div className="mt-4 space-y-3 text-sm font-semibold leading-relaxed text-slate-700">
                      <p>
                        Anak perlu belajar dengan urutan yang jelas: pahami
                        konsep, latihan singkat, bahas kesalahan, lalu naik ke
                        soal cerita atau penalaran.
                      </p>
                      <p>
                        Di BeSmartKids, proses ini dibuat bertahap agar anak
                        berani mencoba dan tidak cepat menyerah ketika bentuk
                        soal berubah.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 border border-slate-200 bg-white p-5">
                  <p className="text-sm font-black text-slate-800">
                    Learning Path yang Disarankan
                  </p>
                  <div className="mt-4 flex max-w-full gap-3 overflow-x-auto pb-3 [-webkit-overflow-scrolling:touch] md:grid md:grid-cols-4 md:overflow-visible md:pb-0">
                    {[
                      "Pahami konsep",
                      "Latihan bertahap",
                      "Bahas kesalahan",
                      "Evaluasi ulang",
                    ].map((step, index) => (
                      <div
                        key={step}
                        className="relative min-w-[145px] max-w-[170px] border border-slate-200 bg-slate-50 p-4 md:min-w-0 md:max-w-none"
                      >
                        <span className="absolute -top-3 left-4 flex h-7 w-7 items-center justify-center rounded-full bg-[#123a82] text-xs font-black text-white">
                          {index + 1}
                        </span>
                        <p className="mt-2 text-sm font-black text-[#102449]">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "analysis" && (
              <div>
                <h2 className="text-xl font-black">Analisis per Kompetensi</h2>
                <div className="mt-4 grid gap-3 md:hidden">
                  {categoryScores.map((item) => (
                    <button
                      key={item.category}
                      type="button"
                      onClick={() => setSelectedCategory(item)}
                      className="border border-slate-200 bg-gradient-to-br from-white to-blue-50/50 p-4 text-left shadow-[0_14px_36px_-30px_rgba(15,23,42,0.75)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-[#102449]">
                            {item.category}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            Benar {item.correct} dari {item.total} soal
                          </p>
                        </div>
                        <span
                          className={`border px-2 py-1 text-[11px] font-black ${levelClass(item.score)}`}
                        >
                          {levelLabel(item.score)}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100 shadow-inner">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-700 via-emerald-500 to-lime-300 shadow-[inset_0_1px_3px_rgba(255,255,255,0.65),0_6px_14px_-9px_rgba(5,150,105,0.9)]"
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                        <span className="text-lg font-black text-blue-700">
                          {item.score}%
                        </span>
                      </div>
                      <p className="mt-3 text-xs font-black text-blue-700">
                        Ketuk untuk melihat detail
                      </p>
                    </button>
                  ))}
                </div>
                <div className="mt-4 hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[720px] border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left text-xs font-black text-slate-500">
                        <th className="px-4 py-3">Kompetensi</th>
                        <th className="px-4 py-3">Skor</th>
                        <th className="px-4 py-3">Persentase</th>
                        <th className="px-4 py-3">Level</th>
                        <th className="px-4 py-3">Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categoryScores.map((item) => (
                        <tr key={item.category}>
                          <td className="px-4 py-3 font-black">
                            {item.category}
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {item.correct}/{item.total}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-3 w-32 overflow-hidden rounded-full bg-slate-100 shadow-inner">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-emerald-700 via-emerald-500 to-lime-300 shadow-[inset_0_1px_3px_rgba(255,255,255,0.65),0_6px_14px_-9px_rgba(5,150,105,0.9)]"
                                  style={{ width: `${item.score}%` }}
                                />
                              </div>
                              <span className="font-black">{item.score}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`border px-3 py-1 text-xs font-black ${levelClass(item.score)}`}
                            >
                              {levelLabel(item.score)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => setSelectedCategory(item)}
                              className="border border-blue-100 px-3 py-1 text-xs font-black text-blue-700 hover:bg-blue-50"
                            >
                              Lihat
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50 font-black">
                        <td className="px-4 py-3">Total</td>
                        <td className="px-4 py-3">
                          {totalCorrect}/{totalQuestions}
                        </td>
                        <td className="px-4 py-3">{attempt.score}%</td>
                        <td className="px-4 py-3">
                          {levelLabel(attempt.score)}
                        </td>
                        <td className="px-4 py-3" />
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-6 border border-blue-200 bg-blue-50 p-4 text-sm font-semibold leading-relaxed text-slate-700">
                  {profile.summary} Tingkatkan latihan pada{" "}
                  {lowestCategories.map((item) => item.category).join(" dan ")}{" "}
                  untuk hasil yang lebih optimal.
                </div>
              </div>
            )}

            {activeTab === "recommendation" && (
              <div>
                <h2 className="text-xl font-black">Rekomendasi Belajar</h2>
                <div className="mt-4 border border-amber-200 bg-amber-50 p-5 text-sm font-semibold leading-7 text-slate-700">
                  <strong>Fokus utama saat ini:</strong>{" "}
                  {focusRecommendations.map((item) => item.category).join(", ")}
                  . Rekomendasi di bawah disusun dari bagian yang nilainya
                  paling perlu diperkuat, sehingga latihan anak lebih terarah
                  dan tidak terasa acak.
                </div>
                <div className="mt-5 space-y-4">
                  {focusRecommendations.map((item, index) => {
                    const rec = categoryNarrative(item.category, item.score);
                    return (
                      <div
                        key={item.category}
                        className="grid gap-4 border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-38px_rgba(15,23,42,0.7)] sm:grid-cols-[88px_1fr]"
                      >
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-emerald-50 text-2xl font-black text-blue-700 shadow-inner">
                          {index + 1}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black">{rec.title}</h3>
                            <span
                              className={`border px-2 py-1 text-[11px] font-black ${levelClass(item.score)}`}
                            >
                              {item.score}%
                            </span>
                          </div>
                          <p className="mt-2 text-sm font-semibold leading-7 text-slate-700">
                            {rec.message}
                          </p>
                          <p className="mt-3 text-sm font-semibold leading-7 text-slate-700">
                            {rec.action}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                              Video sesuai topik
                            </span>
                            <span className="border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                              Latihan bertahap
                            </span>
                            <span className="border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                              Pembahasan konsep
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-5 border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold leading-7 text-slate-700">
                  Rencana belajar yang baik tidak harus membuat anak belajar
                  lama setiap hari. Yang lebih penting adalah urutannya jelas,
                  soalnya sesuai kemampuan, dan anak mendapatkan penjelasan
                  ketika salah. Dengan pola seperti ini, anak lebih mudah merasa
                  mampu dan tidak cepat menyerah saat bertemu soal yang
                  menantang.
                </div>
              </div>
            )}

            {activeTab === "comparison" && (
              <div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-xl font-black">
                      Perbandingan dengan Rata-rata
                    </h2>
                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      Grafik ini membandingkan skor anak dengan target
                      pembanding internal BeSmartKids untuk siswa di jenjang
                      kelas yang sama. Angka pembanding bukan nilai sekolah,
                      tetapi acuan awal untuk membaca area yang sudah kuat dan
                      area yang perlu dilatih.
                    </p>
                  </div>
                  <div className="flex gap-4 text-xs font-black text-slate-600">
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 bg-blue-600" /> Biru: skor anak
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 bg-slate-300" /> Abu-abu: target
                      pembanding BeSmartKids
                    </span>
                  </div>
                </div>

                <div className="mt-6 max-w-full overflow-x-auto border border-slate-200 bg-gradient-to-br from-white to-blue-50/40 p-4 shadow-[0_18px_55px_-45px_rgba(15,23,42,0.8)] [-webkit-overflow-scrolling:touch] sm:p-5">
                  <div className="relative h-72 min-w-[560px] border-b border-l border-slate-200 pl-4 sm:min-w-[620px]">
                    {[100, 75, 50, 25].map((tick) => (
                      <div
                        key={tick}
                        className="absolute left-0 right-0 border-t border-dashed border-slate-200"
                        style={{ bottom: `${tick}%` }}
                      >
                        <span className="absolute -left-4 -top-2 bg-white pr-1 text-[10px] font-bold text-slate-400">
                          {tick}
                        </span>
                      </div>
                    ))}
                    <div className="absolute inset-x-4 bottom-0 flex h-full items-end justify-between gap-2 sm:gap-3">
                      {categoryScores.map((item) => {
                        const average = Math.max(
                          45,
                          Math.min(82, item.score - 12),
                        );
                        const diff = item.score - average;
                        return (
                          <div
                            key={item.category}
                            className="flex min-w-0 flex-1 flex-col items-center gap-2"
                          >
                            <div className="flex h-56 items-end gap-2">
                              <div
                                className="relative w-6 rounded-t-lg bg-gradient-to-t from-blue-700 to-blue-400 shadow-lg sm:w-8"
                                style={{ height: `${item.score}%` }}
                              >
                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-black text-blue-700">
                                  {item.score}
                                </span>
                              </div>
                              <div
                                className="relative w-6 rounded-t-lg bg-gradient-to-t from-slate-400 to-slate-200 sm:w-8"
                                style={{ height: `${average}%` }}
                              >
                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-black text-slate-500">
                                  {average}
                                </span>
                              </div>
                            </div>
                            <p className="min-h-8 max-w-[92px] text-center text-[10px] font-bold leading-tight text-slate-600">
                              {item.category}
                            </p>
                            <span
                              className={`text-[10px] font-black ${diff >= 0 ? "text-emerald-700" : "text-red-600"}`}
                            >
                              {diff >= 0 ? "+" : ""}
                              {diff} poin
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_260px]">
                  <div className="border border-blue-100 bg-blue-50 p-5">
                    <h3 className="text-lg font-black text-blue-700">
                      Makna Grafik
                    </h3>
                    <p className="mt-2 text-sm font-semibold leading-7 text-slate-700">
                      Selisih yang tinggi menunjukkan area yang sudah kuat dan
                      bisa dipakai sebagai modal percaya diri. Selisih yang
                      kecil atau negatif menunjukkan topik yang perlu dilatih
                      lebih terarah. Fokus belajar sebaiknya dimulai dari{" "}
                      {lowestCategories
                        .map((item) => item.category)
                        .join(" dan ")}{" "}
                      agar perkembangan anak lebih terasa.
                    </p>
                  </div>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center bg-blue-600 px-5 py-4 text-center font-black text-white shadow-[0_18px_45px_-34px_rgba(37,99,235,0.9)] hover:bg-[#123a82]"
                  >
                    Jadwalkan Konsultasi
                  </a>
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div>
                <h2 className="text-xl font-black">Riwayat Jawaban</h2>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  Klik nomor soal untuk melihat jawaban dan penjelasan.
                </p>
                <div className="mt-5 grid grid-cols-4 justify-items-center gap-2 min-[380px]:grid-cols-5 sm:grid-cols-10 sm:gap-3">
                  {answers.map((answer, index) => (
                    <button
                      key={answer.question_id}
                      type="button"
                      onClick={() => setSelectedAnswer(answer)}
                      className={`relative h-12 w-12 rounded-full text-sm font-black text-white transition hover:-translate-y-1 hover:scale-105 sm:h-14 sm:w-14 ${answer.is_correct ? "bg-gradient-to-br from-emerald-300 via-emerald-500 to-emerald-800 shadow-[inset_0_2px_4px_rgba(255,255,255,0.55),0_12px_22px_-10px_rgba(5,150,105,0.9)]" : "bg-gradient-to-br from-rose-300 via-red-500 to-red-800 shadow-[inset_0_2px_4px_rgba(255,255,255,0.55),0_12px_22px_-10px_rgba(220,38,38,0.9)]"}`}
                      aria-label={`Lihat soal ${index + 1}`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full bg-emerald-600" />{" "}
                    Jawaban benar
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full bg-red-600" /> Jawaban
                    salah
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {selectedCategory && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-3 py-6 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p
                  className={`w-fit border px-3 py-1 text-xs font-black ${levelClass(selectedCategory.score)}`}
                >
                  {levelLabel(selectedCategory.score)}
                </p>
                <h3 className="mt-3 text-xl font-black text-[#102449]">
                  Detail {selectedCategory.category}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="border border-slate-200 px-3 py-2 text-sm font-black text-slate-600 hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>
            <div className="mt-5 space-y-4 text-sm font-semibold leading-7 text-slate-700">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-black text-slate-500">Skor</p>
                  <p className="mt-1 text-2xl font-black text-[#102449]">
                    {selectedCategory.score}%
                  </p>
                </div>
                <div className="border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-black text-slate-500">Benar</p>
                  <p className="mt-1 text-2xl font-black text-[#102449]">
                    {selectedCategory.correct}/{selectedCategory.total}
                  </p>
                </div>
                <div className="border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-black text-slate-500">Status</p>
                  <p className="mt-1 font-black text-[#102449]">
                    {levelLabel(selectedCategory.score)}
                  </p>
                </div>
              </div>
              <div className="border border-blue-100 bg-blue-50 p-4">
                <div className="mb-4 h-4 overflow-hidden rounded-full bg-white shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-800 via-blue-500 to-cyan-300 shadow-[inset_0_1px_4px_rgba(255,255,255,0.7),0_8px_18px_-12px_rgba(37,99,235,0.95)]"
                    style={{ width: `${selectedCategory.score}%` }}
                  />
                </div>
                <p className="text-xs font-black text-blue-700">Analisis</p>
                <p className="mt-2">
                  {
                    categoryNarrative(
                      selectedCategory.category,
                      selectedCategory.score,
                    ).message
                  }
                </p>
              </div>
              <div className="border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-black text-emerald-700">
                  Langkah Berikutnya
                </p>
                <p className="mt-2">
                  {
                    categoryNarrative(
                      selectedCategory.category,
                      selectedCategory.score,
                    ).action
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedAnswer && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-3 py-6 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p
                  className={`w-fit border px-3 py-1 text-xs font-black ${selectedAnswer.is_correct ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-red-100 bg-red-50 text-red-700"}`}
                >
                  {selectedAnswer.is_correct
                    ? "Jawaban Benar"
                    : "Jawaban Salah"}
                </p>
                <h3 className="mt-3 text-xl font-black text-[#102449]">
                  Pembahasan Soal
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnswer(null)}
                className="border border-slate-200 px-3 py-2 text-sm font-black text-slate-600 hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>
            <div className="mt-5 space-y-4 text-sm font-semibold leading-relaxed text-slate-700">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Soal
                </p>
                <p className="mt-1 text-base font-black text-slate-900">
                  <MathText text={selectedAnswer.prompt} />
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-black text-slate-500">
                    Jawaban anak
                  </p>
                  <p className="mt-1 font-black">
                    <MathText text={selectedAnswer.selected_answer ?? "-"} />
                  </p>
                </div>
                <div className="border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-xs font-black text-emerald-700">
                    Jawaban benar
                  </p>
                  <p className="mt-1 font-black">
                    <MathText text={selectedAnswer.correct_answer} />
                  </p>
                </div>
              </div>
              <div className="border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-black text-blue-700">Penjelasan</p>
                <p className="mt-2">
                  <MathText text={selectedAnswer.explanation} />
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
