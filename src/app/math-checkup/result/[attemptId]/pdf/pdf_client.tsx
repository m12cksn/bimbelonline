
"use client";

import { useEffect, useMemo, useState } from "react";

type CategoryScore = { category: string; score: number; correct: number; total: number };
type Attempt = { id: string; student_name: string; parent_whatsapp: string; grade_level: number; concern?: string | null; score: number; result_level: string; completed_at?: string | null; created_at?: string | null };
type Profile = { level: string; tone: string; summary: string; recommendation: string[] };
type Answer = { question_id: string; prompt: string; selected_answer: string | null; correct_answer: string; category: string; is_correct: boolean; explanation: string };

function formatName(value: string) {
  return value.trim().replace(/\s+/g, " ").split(" ").map((word) => word ? word.charAt(0).toUpperCase() + word.slice(1) : word).join(" ");
}
function levelLabel(score: number) { if (score >= 85) return "Sangat Baik"; if (score >= 70) return "Baik"; if (score >= 55) return "Cukup"; return "Perlu Latihan"; }
function scoreColor(score: number) { if (score >= 70) return "#2f9b5f"; if (score >= 55) return "#f97316"; return "#dc2626"; }
function categoryCopy(category: string) {
  const map: Record<string, { desc: string; strength: string[]; improve: string[] }> = {
    "Pemahaman Bilangan": { desc: "Kemampuan memahami nilai bilangan, urutan, perbandingan, dan pola sederhana.", strength: ["Mengenali urutan bilangan", "Membandingkan nilai"], improve: ["Nilai tempat", "Pola bilangan"] },
    "Kelancaran Berhitung": { desc: "Kemampuan melakukan operasi penjumlahan, pengurangan, perkalian, dan pembagian.", strength: ["Operasi dasar", "Strategi hitung"], improve: ["Hitung bersusun", "Operasi campuran"] },
    "Pecahan": { desc: "Kemampuan memahami, membandingkan, dan menggunakan pecahan dalam soal.", strength: ["Mengenal bagian utuh", "Pecahan senilai"], improve: ["Berbeda penyebut", "Model visual"] },
    "Soal Cerita": { desc: "Kemampuan memahami informasi soal cerita dan menentukan operasi yang tepat.", strength: ["Informasi penting", "Membaca pertanyaan"], improve: ["Model matematika", "Memilih operasi"] },
    "Penalaran Logis": { desc: "Kemampuan melihat pola, hubungan, dan aturan tersembunyi dalam soal.", strength: ["Mencari pola", "Menghubungkan aturan"], improve: ["Menjelaskan alasan", "Soal non-rutin"] },
  };
  return map[category] ?? map["Soal Cerita"];
}
function iconFor(category: string) {
  if (category === "Kelancaran Berhitung") return "/images/icons/aritmatika.webp";
  if (category === "Pecahan") return "/images/icons/fraction.webp";
  if (category === "Soal Cerita") return "/images/icons/soal cerita.webp";
  if (category === "Penalaran Logis") return "/images/icons/geometry.webp";
  if (category === "Pemahaman Bilangan") return "/images/icons/aritmatika.webp";
  return "/images/icons/pengukuran.webp";
}

function shortSummary(name: string, score: number, weakest: CategoryScore[]) {
  const focus = weakest.map((item) => item.category).join(" dan ");
  if (score >= 80) return `${name} menunjukkan kemampuan matematika yang kuat. Tantangan berikutnya adalah menjaga konsistensi dan memperluas latihan pada ${focus}.`;
  if (score >= 60) return `${name} sudah memiliki fondasi yang cukup baik. Agar lebih percaya diri, latihan perlu diarahkan terutama pada ${focus}.`;
  return `${name} masih perlu membangun fondasi secara bertahap. Fokus awal yang disarankan adalah ${focus}, dengan latihan visual dan pembahasan perlahan.`;
}
function BarCompare({ scores }: { scores: CategoryScore[] }) {
  return <div className="pdf-chart">{scores.map((item) => { const average = Math.max(45, Math.min(82, item.score - 12)); return <div key={item.category} className="pdf-chart-col"><div className="pdf-bars"><span className="pdf-bar pdf-bar-main" style={{ height: `${item.score}%` }}><b>{item.score}</b></span><span className="pdf-bar pdf-bar-avg" style={{ height: `${average}%` }}><b>{average}</b></span></div><p>{item.category}</p></div>; })}</div>;
}

export default function MathCheckupPdfClient({ attemptId }: { attemptId: string }) {
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
        const data = (await response.json()) as { ok?: boolean; attempt?: Attempt; profile?: Profile; categoryScores?: CategoryScore[]; answers?: Answer[]; error?: string };
        if (!response.ok || !data.ok) throw new Error(data.error ?? "Gagal memuat hasil.");
        if (!active) return;
        setAttempt(data.attempt ?? null); setProfile(data.profile ?? null); setCategoryScores(data.categoryScores ?? []); setAnswers(data.answers ?? []);
      } catch (err) { if (active) setError((err as Error).message); } finally { if (active) setLoading(false); }
    }
    load(); return () => { active = false; };
  }, [attemptId]);

  const weakest = useMemo(() => [...categoryScores].sort((a, b) => a.score - b.score).slice(0, 3), [categoryScores]);
  const name = attempt ? formatName(attempt.student_name) : "";
  const testDate = attempt?.completed_at || attempt?.created_at ? new Date(attempt.completed_at ?? attempt.created_at ?? "").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-";
  const correctCount = answers.filter((answer) => answer.is_correct).length;

  if (loading) return <main className="pdf-loading">Menyiapkan laporan PDF...</main>;
  if (error || !attempt || !profile) return <main className="pdf-loading pdf-error">{error ?? "Hasil tidak tersedia."}</main>;

  return (
    <main className="pdf-shell">
      <style jsx global>{`
        @page { size: A4; margin: 0; }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body { background: #eaf0f8; }
        .print-toolbar { position: sticky; top: 0; z-index: 20; display:flex; justify-content:center; gap:12px; padding:12px; background:rgba(244,247,251,.96); border-bottom:1px solid #dbe3ef; }
        .print-toolbar button,.print-toolbar a{border:0;background:#123a82;color:white;padding:10px 16px;font-weight:900;font-size:13px;text-decoration:none}.print-toolbar a{background:white;color:#123a82;border:1px solid #cddaf0}
        .pdf-sheet{width:210mm;height:297mm;margin:18px auto;background:linear-gradient(135deg,#f8fbff 0%,#fff 48%,#f2f7ff 100%);color:#071f55;box-shadow:0 24px 80px -55px rgba(15,23,42,.8);break-after:page;page-break-after:always;position:relative;overflow:hidden;font-family:Poppins,Arial,sans-serif;padding:9mm 11mm 12mm}.pdf-brand{display:flex;align-items:center}.pdf-brand img{height:34px;width:auto;object-fit:contain}.pdf-logo{display:none}.pdf-card{background:rgba(255,255,255,.96);border:1px solid #dde7f3;border-radius:10px;overflow:hidden;box-shadow:0 10px 26px -24px rgba(15,23,42,.7)}.pdf-section-title{background:#082d73;color:white;padding:8px 12px;font-weight:900;font-size:11.5px}.hero{display:grid;grid-template-columns:1.05fr .95fr;gap:10px;align-items:center;margin-top:12px}.hero-title p{margin:0;font-size:15px;font-weight:800;text-align:center}.hero-title h1{margin:8px 0 0;font-size:36px;line-height:.96;letter-spacing:-1.1px;text-align:center}.profile{display:grid;grid-template-columns:96px 1fr;gap:12px;padding:11px;align-items:center}.profile img{width:96px;height:96px;object-fit:cover;border-radius:12px;background:#eaf0f8}.info{display:grid;grid-template-columns:1fr 1fr;gap:8px}.info span,.metric-label{color:#4b5f86;font-size:10px;font-weight:900;text-transform:uppercase}.info b{display:block;margin-top:4px;font-size:14px}.summary-row{display:grid;grid-template-columns:.82fr 1.18fr;gap:14px;padding:14px}.score-number{font-size:50px;line-height:1;font-weight:900;letter-spacing:-2px}.badge{display:inline-block;min-width:88px;margin-top:10px;padding:7px 12px;border-radius:10px;background:#dff5e6;color:#167242;text-align:center;font-weight:900;font-size:12px}.summary-text{margin-top:10px;font-size:9.8px;font-weight:650;line-height:1.5;color:#23365f}.chart-legend{display:flex;gap:10px;align-items:center;margin:6px 0 0;font-size:8.5px;font-weight:900;color:#4b5f86}.chart-legend span{display:flex;align-items:center;gap:4px}.chart-legend i{width:9px;height:9px;border-radius:2px;display:inline-block}.legend-blue{background:#1746b7}.legend-gray{background:#8995aa}.pdf-chart{height:126px;display:flex;align-items:end;gap:10px;border-left:1px solid #d8e2ef;border-bottom:1px solid #d8e2ef;padding:18px 8px 0}.pdf-chart-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;height:100%;justify-content:flex-end}.pdf-bars{height:90px;display:flex;align-items:end;gap:7px}.pdf-bar{position:relative;width:18px;border-radius:6px 6px 0 0;display:block}.pdf-bar b{position:absolute;top:-17px;left:50%;transform:translateX(-50%);font-size:9px}.pdf-bar-main{background:linear-gradient(#2f6df0,#1746b7)}.pdf-bar-avg{background:linear-gradient(#cfd6e3,#8995aa)}.pdf-chart-col p{min-height:20px;text-align:center;font-size:7.2px;font-weight:800;color:#4b5f86}.competency-table{padding:8px 12px}.comp-row{display:grid;grid-template-columns:1.28fr .44fr 1fr .66fr;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid #e8eef6;font-size:9.7px;font-weight:850}.comp-row:last-child{border-bottom:0}.progress{height:10px;border-radius:99px;background:linear-gradient(#e6edf7,#f8fbff);overflow:hidden;box-shadow:inset 0 2px 4px rgba(15,23,42,.13)}.progress span{display:block;height:100%;border-radius:99px;box-shadow:inset 0 1px 3px rgba(255,255,255,.65),0 6px 14px -10px rgba(15,23,42,.85);background-image:linear-gradient(90deg,rgba(0,0,0,.12),rgba(255,255,255,.35),rgba(0,0,0,.08))}.mini-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}.mini-card{padding:9px;border:1px solid #dfe8f4;border-radius:12px;background:white}.mini-card h3{margin:0;font-size:13px}.mini-card p{margin:7px 0 0;color:#23365f;font-size:9.5px;line-height:1.42;font-weight:650}.page-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:7px}.page-title h2{margin:0;font-size:17px}.detail-list{display:grid;gap:5px;padding:6px}.detail-item{border:1px solid #dfe8f4;border-radius:10px;background:white;overflow:hidden}.detail-head{display:grid;grid-template-columns:30px 1fr auto;gap:8px;padding:7px 10px 5px;align-items:center}.detail-icon{width:26px;height:26px;object-fit:contain}.detail-head h3{margin:0;font-size:11.6px}.detail-head p{margin:2px 0 0;color:#4b5f86;font-weight:650;font-size:7.8px;line-height:1.2}.detail-score{text-align:right;font-size:18px;font-weight:900;line-height:1}.detail-body{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:0 10px 6px}.detail-body h4{margin:0 0 3px;font-size:9.3px}.detail-body ul{margin:0;padding-left:12px;color:#23365f;font-size:7.6px;font-weight:650;line-height:1.25}.recommend{margin-top:6px}.rec-row{display:grid;grid-template-columns:30px 1fr 104px;gap:8px;padding:7px 10px;border-bottom:1px solid #e8eef6;align-items:center}.rec-row:last-child{border-bottom:0}.rec-row img{width:25px;height:25px;object-fit:contain}.rec-row h3{margin:0;font-size:10.6px}.rec-row p{margin:3px 0 0;color:#4b5f86;font-size:7.8px;font-weight:650;line-height:1.25}.rec-pill{border:1px solid #c7d8f8;border-radius:8px;padding:5px;text-align:center;color:#1d4ed8;font-weight:900;font-size:7.8px}.tips{display:grid;grid-template-columns:1fr 100px;gap:8px;padding:10px 12px;align-items:center}.tips h3{margin:0;font-size:12px}.tips ul{margin:5px 0 0;padding-left:15px;font-size:8.9px;line-height:1.42;font-weight:650;color:#23365f}.tips img{width:94px;justify-self:end;border-radius:10px}.footer{position:absolute;left:11mm;right:11mm;bottom:4mm;display:flex;justify-content:space-between;align-items:center;color:#51658c;font-size:9px;font-weight:700;border-top:1px solid #dfe8f4;padding-top:5px;background:rgba(248,251,255,.9)}.pdf-sheet:last-of-type{break-after:auto;page-break-after:auto}.pdf-loading{min-height:100vh;display:grid;place-items:center;font-weight:900;color:#123a82;background:#f4f7fb}.pdf-error{color:#b91c1c}@media print{body{background:white;-webkit-print-color-adjust:exact;print-color-adjust:exact}.print-toolbar{display:none}.pdf-shell,.pdf-sheet,.pdf-card,.pdf-section-title,.pdf-bar,.pdf-bar-main,.pdf-bar-avg,.progress span,.badge{ -webkit-print-color-adjust:exact; print-color-adjust:exact; }.pdf-sheet{margin:0;box-shadow:none;break-after:page;page-break-after:always}.pdf-sheet:last-of-type{break-after:auto;page-break-after:auto}.pdf-section-title{background:#082d73!important;color:#fff!important}.pdf-bar-main{background:#1746b7!important}.pdf-bar-avg{background:#8995aa!important}}
      `}</style>
      <div className="print-toolbar"><button type="button" onClick={() => window.print()}>Download / Print PDF</button><a href={`/math-checkup/result/${attemptId}`}>Kembali ke Hasil</a></div>
      <section className="pdf-sheet">
        <div className="pdf-brand"><img src="/images/logo_horizontal.png" alt="BeSmartKids" /></div>
        <div className="hero"><div className="hero-title"><p>LAPORAN HASIL</p><h1>MATH CHECK-UP</h1><p>Analisis Kemampuan Matematika</p></div><div className="pdf-card profile"><img src="/images/diag/diag.webp" alt="Foto anak" /><div className="info"><div><span>Nama</span><b>{name}</b></div><div><span>Kelas</span><b>{attempt.grade_level} SD</b></div><div><span>Tanggal Tes</span><b>{testDate}</b></div><div><span>Tes</span><b>Online</b></div></div></div></div>
        <div className="pdf-card" style={{ marginTop: 14 }}><div className="pdf-section-title">RINGKASAN HASIL</div><div className="summary-row"><div><span className="metric-label">SKOR TOTAL</span><div className="score-number">{attempt.score}<span style={{ fontSize: 22 }}>/100</span></div><span className="badge">{levelLabel(attempt.score)}</span><p className="summary-text">{shortSummary(name, attempt.score, weakest)}</p></div><div><span className="metric-label">PERBANDINGAN SKOR</span><div className="chart-legend"><span><i className="legend-blue" />Biru: skor anak</span><span><i className="legend-gray" />Abu-abu: target BeSmartKids</span></div><BarCompare scores={categoryScores} /></div></div></div>
        <div className="pdf-card" style={{ marginTop: 12 }}><div className="pdf-section-title">SKOR PER KOMPETENSI</div><div className="competency-table">{categoryScores.map((item) => <div className="comp-row" key={item.category}><span>{item.category}</span><span>{item.score}/100</span><div className="progress"><span style={{ width: `${item.score}%`, background: scoreColor(item.score) }} /></div><span style={{ color: scoreColor(item.score) }}>{levelLabel(item.score)}</span></div>)}</div></div>
        <div className="mini-grid"><div className="mini-card"><h3>Skor Terakhir</h3><p>{testDate}</p></div><div className="mini-card"><h3>Tes Dilakukan</h3><p>1 kali diagnostic awal</p></div><div className="mini-card"><h3>Jawaban Benar</h3><p>{correctCount} dari {answers.length || categoryScores.reduce((sum, item) => sum + item.total, 0)} soal</p></div></div>
        <div className="pdf-card" style={{ marginTop: 8, padding: 10 }}><h3 style={{ margin: 0, fontSize: 14 }}>Terus semangat, {name}!</h3><p style={{ margin: "6px 0 0", fontSize: 9.4, lineHeight: 1.4, fontWeight: 650, color: "#23365f" }}>Setiap usaha adalah langkah menuju pemahaman yang lebih baik. BeSmartKids siap mendampingi perjalanan belajarmu.</p></div>
        <div className="footer"><span>www.besmartkids.id</span><span>Halaman 1 dari 2</span></div>
      </section>
      <section className="pdf-sheet">
        <div className="page-title"><div className="pdf-brand"><img src="/images/logo_horizontal.png" alt="BeSmartKids" /></div><h2>Detail Laporan</h2></div>
        <div className="pdf-card"><div className="pdf-section-title">DETAIL HASIL TIAP KOMPETENSI</div><div className="detail-list">{categoryScores.map((item) => { const copy = categoryCopy(item.category); return <div className="detail-item" key={item.category}><div className="detail-head"><img className="detail-icon" src={iconFor(item.category)} alt={item.category} /><div><h3>{item.category}</h3><p>{copy.desc}</p></div><div className="detail-score" style={{ color: scoreColor(item.score) }}>{item.score}<span style={{ fontSize: 11 }}>/100</span></div></div><div style={{ padding: "0 12px 7px" }}><div className="progress"><span style={{ width: `${item.score}%`, background: scoreColor(item.score) }} /></div></div><div className="detail-body"><div><h4>Kekuatan</h4><ul>{copy.strength.map((x) => <li key={x}>{x}</li>)}</ul></div><div><h4>Perlu Ditingkatkan</h4><ul>{copy.improve.map((x) => <li key={x}>{x}</li>)}</ul></div></div></div>; })}</div></div>
        <div className="pdf-card recommend"><div className="pdf-section-title">REKOMENDASI BELAJAR</div>{weakest.map((item) => <div className="rec-row" key={item.category}><img src={iconFor(item.category)} alt={item.category} /><div><h3>{item.category}</h3><p>Ananda perlu latihan bertahap pada topik ini agar pemahaman konsep dan ketelitian meningkat.</p></div><div className="rec-pill">Latihan Disarankan<br />15-20 menit/hari</div></div>)}</div>
        <div className="footer"><span>www.besmartkids.id</span><span>Halaman 2 dari 2</span></div>
      </section>
    </main>
  );
}
