"use client";

import { useEffect, useMemo, useState } from "react";

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
  created_at?: string | null;
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
function scoreColor(score: number) {
  if (score >= 70) return "#2f9b5f";
  if (score >= 55) return "#f97316";
  return "#dc2626";
}
function categoryCopy(category: string) {
  const map: Record<
    string,
    { desc: string; strength: string[]; improve: string[] }
  > = {
    "Pemahaman Bilangan": {
      desc: "Kemampuan memahami nilai bilangan, urutan, perbandingan, dan pola sederhana.",
      strength: ["Mengenali urutan bilangan", "Membandingkan nilai"],
      improve: ["Nilai tempat", "Pola bilangan"],
    },
    "Kelancaran Berhitung": {
      desc: "Kemampuan melakukan operasi penjumlahan, pengurangan, perkalian, dan pembagian.",
      strength: ["Operasi dasar", "Strategi hitung"],
      improve: ["Hitung bersusun", "Operasi campuran"],
    },
    Pecahan: {
      desc: "Kemampuan memahami, membandingkan, dan menggunakan pecahan dalam soal.",
      strength: ["Mengenal bagian utuh", "Pecahan senilai"],
      improve: ["Berbeda penyebut", "Model visual"],
    },
    "Soal Cerita": {
      desc: "Kemampuan memahami informasi soal cerita dan menentukan operasi yang tepat.",
      strength: ["Informasi penting", "Membaca pertanyaan"],
      improve: ["Model matematika", "Memilih operasi"],
    },
    "Penalaran Logis": {
      desc: "Kemampuan melihat pola, hubungan, dan aturan tersembunyi dalam soal.",
      strength: ["Mencari pola", "Menghubungkan aturan"],
      improve: ["Menjelaskan alasan", "Soal non-rutin"],
    },
  };
  return map[category] ?? map["Soal Cerita"];
}
function iconFor(category: string) {
  if (category === "Kelancaran Berhitung")
    return "/images/icons/aritmatika.webp";
  if (category === "Pecahan") return "/images/icons/fraction.webp";
  if (category === "Soal Cerita") return "/images/icons/soal cerita.webp";
  if (category === "Penalaran Logis") return "/images/icons/geometry.webp";
  if (category === "Pemahaman Bilangan") return "/images/icons/aritmatika.webp";
  return "/images/icons/pengukuran.webp";
}

function shortSummary(name: string, score: number, weakest: CategoryScore[]) {
  const focus = weakest.map((item) => item.category).join(" dan ");
  if (score >= 80)
    return `${name} menunjukkan kemampuan matematika yang kuat. Tantangan berikutnya adalah menjaga konsistensi dan memperluas latihan pada ${focus}.`;
  if (score >= 60)
    return `${name} sudah memiliki fondasi yang cukup baik. Agar lebih percaya diri, latihan perlu diarahkan terutama pada ${focus}.`;
  return `${name} masih perlu membangun fondasi secara bertahap. Fokus awal yang disarankan adalah ${focus}, dengan latihan visual dan pembahasan perlahan.`;
}
function BarCompare({ scores }: { scores: CategoryScore[] }) {
  return (
    <div className="pdf-chart">
      {scores.map((item) => {
        const average = Math.max(45, Math.min(82, item.score - 12));
        return (
          <div key={item.category} className="pdf-chart-col">
            <div className="pdf-bars">
              <span
                className="pdf-bar pdf-bar-main"
                style={{ height: `${item.score}%` }}
              >
                <b>{item.score}</b>
              </span>
              <span
                className="pdf-bar pdf-bar-avg"
                style={{ height: `${average}%` }}
              >
                <b>{average}</b>
              </span>
            </div>
            <p>{item.category}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function MathCheckupPdfClient({
  attemptId,
}: {
  attemptId: string;
}) {
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categoryScores, setCategoryScores] = useState<CategoryScore[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const weakest = useMemo(
    () => [...categoryScores].sort((a, b) => a.score - b.score).slice(0, 3),
    [categoryScores],
  );
  const name = attempt ? formatName(attempt.student_name) : "";
  const testDate =
    attempt?.completed_at || attempt?.created_at
      ? new Date(
          attempt.completed_at ?? attempt.created_at ?? "",
        ).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "-";
  const correctCount = answers.filter((answer) => answer.is_correct).length;

  if (loading)
    return <main className="pdf-loading">Menyiapkan laporan PDF...</main>;
  if (error || !attempt || !profile)
    return (
      <main className="pdf-loading pdf-error">
        {error ?? "Hasil tidak tersedia."}
      </main>
    );

  return (
    <main className="pdf-shell">
      <style jsx global>{`
        @page {
          size: A4;
          margin: 0;
        }

        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        body {
          background: #eef4fb;
          margin: 0;
          font-family: Arial, sans-serif;
          color: #17325c;
        }

        .pdf-loading {
          min-height: 100vh;
          display: grid;
          place-items: center;
          font-weight: 800;
          color: #123a82;
        }

        .print-toolbar {
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          justify-content: center;
          gap: 12px;
          padding: 12px;
          background: rgba(244, 247, 251, 0.96);
          border-bottom: 1px solid #dbe3ef;
        }

        .print-toolbar button,
        .print-toolbar a {
          border: 0;
          background: #123a82;
          color: white;
          padding: 10px 16px;
          font-weight: 800;
          font-size: 14px;
          text-decoration: none;
          border-radius: 8px;
        }

        .print-toolbar a {
          background: white;
          color: #123a82;
          border: 1px solid #cddaf0;
        }

        .pdf-page {
          width: 210mm;
          min-height: 297mm;
          margin: 18px auto;
          background: white;
          padding: 14mm 14mm 16mm;
          box-shadow: 0 18px 60px -45px rgba(15, 23, 42, 0.45);
          position: relative;
          break-after: page;
          page-break-after: always;
        }

        .pdf-page:last-of-type {
          break-after: auto;
          page-break-after: auto;
        }

        .brand {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .brand img {
          height: 34px;
          width: auto;
        }

        .brand small {
          font-size: 11px;
          color: #5d7093;
          font-weight: 700;
        }

        .hero {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 18px;
          margin-bottom: 18px;
        }

        .hero-box,
        .card,
        .section {
          border: 1px solid #dfe8f4;
          border-radius: 16px;
          background: #fff;
        }

        .hero-left {
          padding: 18px;
        }

        .hero-left p {
          margin: 0;
          font-size: 13px;
          font-weight: 700;
          color: #4c648d;
        }

        .hero-left h1 {
          margin: 8px 0 10px;
          font-size: 31px;
          line-height: 1.05;
          color: #0f2f6f;
        }

        .hero-left .summary {
          margin-top: 10px;
          font-size: 13px;
          line-height: 1.6;
          color: #29456f;
          font-weight: 600;
        }

        .hero-right {
          padding: 18px;
          display: grid;
          gap: 14px;
          align-content: start;
        }

        .student-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .student-item span {
          display: block;
          font-size: 11px;
          color: #6a7b99;
          font-weight: 800;
          text-transform: uppercase;
        }

        .student-item b {
          display: block;
          margin-top: 5px;
          font-size: 15px;
          color: #17325c;
        }

        .score-card {
          padding: 18px;
          text-align: center;
          background: linear-gradient(135deg, #edf5ff 0%, #f8fbff 100%);
        }

        .score-card .label {
          font-size: 12px;
          color: #5d7093;
          font-weight: 800;
          text-transform: uppercase;
        }

        .score-card .score {
          font-size: 54px;
          line-height: 1;
          font-weight: 900;
          color: #123a82;
          margin: 10px 0 8px;
        }

        .score-card .badge {
          display: inline-block;
          padding: 8px 14px;
          border-radius: 999px;
          background: #dff5e6;
          color: #167242;
          font-size: 13px;
          font-weight: 900;
        }

        .section {
          margin-top: 16px;
          overflow: hidden;
        }

        .section-title {
          padding: 12px 16px;
          background: #123a82;
          color: white;
          font-size: 16px;
          font-weight: 800;
        }

        .section-body {
          padding: 16px;
        }

        .skill-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .skill-card {
          border: 1px solid #e4ebf5;
          border-radius: 14px;
          padding: 14px;
          background: #fbfdff;
        }

        .skill-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .skill-top h3 {
          margin: 0;
          font-size: 15px;
          color: #17325c;
        }

        .skill-top strong {
          font-size: 15px;
          color: #123a82;
        }

        .progress {
          height: 12px;
          border-radius: 999px;
          background: #e9eef6;
          overflow: hidden;
        }

        .progress span {
          display: block;
          height: 100%;
          border-radius: 999px;
        }

        .skill-level {
          margin-top: 8px;
          font-size: 12px;
          color: #51688f;
          font-weight: 700;
        }

        .focus-list {
          display: grid;
          gap: 12px;
        }

        .focus-item {
          border: 1px solid #e4ebf5;
          border-radius: 14px;
          padding: 14px;
          background: #fbfdff;
        }

        .focus-item h3 {
          margin: 0 0 6px;
          font-size: 15px;
          color: #123a82;
        }

        .focus-item p {
          margin: 0;
          font-size: 13px;
          line-height: 1.6;
          color: #29456f;
        }

        .recommend-list {
          display: grid;
          gap: 14px;
        }

        .recommend-item {
          border: 1px solid #e4ebf5;
          border-radius: 14px;
          padding: 14px;
          background: #fbfdff;
        }

        .recommend-item h3 {
          margin: 0 0 8px;
          font-size: 15px;
          color: #17325c;
        }

        .recommend-item p {
          margin: 0;
          font-size: 13px;
          line-height: 1.6;
          color: #29456f;
        }

        .tips-box ul {
          margin: 0;
          padding-left: 18px;
        }

        .tips-box li {
          margin-bottom: 8px;
          font-size: 13px;
          line-height: 1.6;
          color: #29456f;
          font-weight: 600;
        }

        .next-step {
          padding: 18px;
          background: linear-gradient(135deg, #f4f9ff 0%, #ffffff 100%);
          border: 1px solid #dfe8f4;
          border-radius: 16px;
        }

        .next-step h3 {
          margin: 0 0 10px;
          font-size: 18px;
          color: #123a82;
        }

        .next-step p {
          margin: 0;
          font-size: 13px;
          line-height: 1.7;
          color: #29456f;
          font-weight: 600;
        }

        .footer {
          position: absolute;
          left: 14mm;
          right: 14mm;
          bottom: 8mm;
          display: flex;
          justify-content: space-between;
          border-top: 1px solid #e3eaf4;
          padding-top: 6px;
          font-size: 11px;
          color: #5d7093;
          font-weight: 700;
        }

        @media print {
          body {
            background: white;
          }

          .print-toolbar {
            display: none;
          }

          .pdf-page {
            margin: 0;
            box-shadow: none;
          }
        }
      `}</style>

      <div className="print-toolbar">
        <button type="button" onClick={() => window.print()}>
          Download / Print PDF
        </button>
        <a href={`/math-checkup/result/${attemptId}`}>Kembali ke Hasil</a>
      </div>

      <section className="pdf-page">
        <div className="brand">
          <img src="/images/logo_horizontal.png" alt="BeSmartKids" />
          <small>Laporan Hasil Math Check-Up</small>
        </div>

        <div className="hero">
          <div className="hero-box hero-left">
            <p>HASIL DIAGNOSTIC MATEMATIKA</p>
            <h1>Ringkasan Kemampuan Belajar {name}</h1>
            <div className="summary">
              {shortSummary(name, attempt.score, weakest)}
            </div>
          </div>

          <div className="hero-box hero-right">
            <div className="student-grid">
              <div className="student-item">
                <span>Nama</span>
                <b>{name}</b>
              </div>
              <div className="student-item">
                <span>Kelas</span>
                <b>{attempt.grade_level} SD</b>
              </div>
              <div className="student-item">
                <span>Tanggal Tes</span>
                <b>{testDate}</b>
              </div>
              <div className="student-item">
                <span>Jawaban Benar</span>
                <b>
                  {correctCount} dari{" "}
                  {answers.length ||
                    categoryScores.reduce(
                      (sum, item) => sum + item.total,
                      0,
                    )}{" "}
                  soal
                </b>
              </div>
            </div>

            <div className="score-card">
              <div className="label">Skor Total</div>
              <div className="score">{attempt.score}</div>
              <div className="badge">{levelLabel(attempt.score)}</div>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="section-title">Skor per Kompetensi</div>
          <div className="section-body">
            <div className="skill-grid">
              {categoryScores.map((item) => (
                <div key={item.category} className="skill-card">
                  <div className="skill-top">
                    <h3>{item.category}</h3>
                    <strong>{item.score}/100</strong>
                  </div>
                  <div className="progress">
                    <span
                      style={{
                        width: `${item.score}%`,
                        background: scoreColor(item.score),
                      }}
                    />
                  </div>
                  <div className="skill-level">{levelLabel(item.score)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="section">
          <div className="section-title">Fokus Utama yang Perlu Diperkuat</div>
          <div className="section-body">
            <div className="focus-list">
              {weakest.map((item) => (
                <div key={item.category} className="focus-item">
                  <h3>{item.category}</h3>
                  <p>
                    Ananda perlu latihan lebih terarah pada area ini agar
                    pemahaman konsep dan ketelitian menjawab soal semakin baik.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="footer">
          <span>www.besmartkids.id</span>
          <span>Halaman 1 dari 2</span>
        </div>
      </section>

      <section className="pdf-page">
        <div className="brand">
          <img src="/images/logo_horizontal.png" alt="BeSmartKids" />
          <small>Rekomendasi Belajar</small>
        </div>

        <div className="section">
          <div className="section-title">Penjelasan dan Rekomendasi</div>
          <div className="section-body">
            <div className="recommend-list">
              {categoryScores.map((item) => {
                const copy = categoryCopy(item.category);

                return (
                  <div key={item.category} className="recommend-item">
                    <h3>
                      {item.category} — {item.score}/100
                    </h3>
                    <p>
                      {copy.desc} Fokus penguatan berikutnya:{" "}
                      {copy.improve.join(", ")}.
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="section">
          <div className="section-title">Saran Pendampingan di Rumah</div>
          <div className="section-body tips-box">
            <ul>
              <li>
                Latihan rutin 10–15 menit setiap hari lebih baik daripada lama
                tetapi jarang.
              </li>
              <li>
                Mulai dari konsep yang paling lemah, lalu naik bertahap ke soal
                yang lebih menantang.
              </li>
              <li>
                Ajak anak menjelaskan cara berpikirnya, bukan hanya mencari
                jawaban akhir.
              </li>
              <li>
                Gunakan benda visual atau contoh sehari-hari agar konsep lebih
                mudah dipahami.
              </li>
            </ul>
          </div>
        </div>

        <div className="section">
          <div className="section-title">Langkah Berikutnya</div>
          <div className="section-body">
            <div className="next-step">
              <h3>Rekomendasi BeSmartKids</h3>
              <p>
                Berdasarkan hasil diagnostic ini, area belajar yang paling perlu
                diprioritaskan adalah{" "}
                <strong>
                  {weakest.map((item) => item.category).join(", ")}
                </strong>
                . BeSmartKids merekomendasikan latihan terarah dan sesi belajar
                bertahap agar ananda lebih percaya diri serta memahami konsep
                dengan lebih kuat.
              </p>
            </div>
          </div>
        </div>

        <div className="footer">
          <span>www.besmartkids.id</span>
          <span>Halaman 2 dari 2</span>
        </div>
      </section>
    </main>
  );
}
