"use client";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Lightbulb, RotateCcw, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import styles from "./preview.module.css";

const examples = [{ top: 3, bottom: 4 }, { top: 2, bottom: 3 }, { top: 3, bottom: 6 }];
export default function FractionPreview() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [hint, setHint] = useState(false);
  const [finished, setFinished] = useState(false);
  const question = examples[step];
  const locked = feedback === "correct" || attempts >= 2;
  const reset = () => { setSelected([]); setAttempts(0); setFeedback(null); setHint(false); };
  function toggle(index: number) {
    if (locked) return;
    setFeedback(null);
    setSelected(parts => parts.includes(index) ? parts.filter(p => p !== index) : [...parts, index]);
  }
  return <main className={styles.page}>
    <header className={styles.header}>
      <Link href="/materials" className={styles.back} aria-label="Kembali ke materi"><ArrowLeft size={20} /></Link>
      <span className={styles.brand}><Lightbulb size={25} /> BeSmartKids</span>
      <span className={styles.preview}>Pratinjau desain</span>
    </header>
    <div className={styles.notice}>Soal contoh • Jawaban tidak disimpan</div>
    <section className={styles.workspace} aria-labelledby="question-title">
      <div className={styles.progressLabel}><span>PETUALANGAN PECAHAN</span><span>Soal {step + 1} dari {examples.length}</span></div>
      <progress className={styles.progress} value={finished ? 3 : step} max={3} aria-label="Soal contoh selesai" />
      {finished ? <div className={styles.complete}><Sparkles size={48} /><h1>Eksplorasi selesai!</h1><p>Terima kasih sudah mencoba tampilan baru.</p><button className={styles.primary} onClick={() => { setStep(0); setFinished(false); reset(); }}>Coba lagi <RotateCcw size={18} /></button></div> : <>
        <div className={styles.heading}><span className={styles.badge}>Sentuh & warnai</span><h1 id="question-title">Warnai <span className={styles.fraction} aria-label={`${question.top} per ${question.bottom}`}><span>{question.top}</span><span>{question.bottom}</span></span> bagian cokelat</h1><p>Pilih potongannya. Lalu periksa jawabanmu.</p></div>
        <div className={styles.playground}>
          <div className={styles.chocolate} role="group" aria-label={`Cokelat dengan ${question.bottom} bagian sama besar`} style={{ gridTemplateColumns: `repeat(${question.bottom}, 1fr)` }}>
            {Array.from({ length: question.bottom }, (_, index) => <button key={index} className={`${styles.piece} ${selected.includes(index) ? styles.selected : ""}`} aria-label={`Bagian ${index + 1} dari ${question.bottom}`} aria-pressed={selected.includes(index)} disabled={locked} onClick={() => toggle(index)}>{selected.includes(index) && <Check aria-hidden="true" size={30} />}</button>)}
          </div>
          <p className={styles.count} aria-live="polite"><strong>{selected.length}</strong> dari {question.bottom} bagian dipilih</p>
        </div>
        <div className={styles.support}><button className={styles.help} aria-expanded={hint} aria-controls="fraction-hint" onClick={() => setHint(!hint)}><Lightbulb size={19} /> Butuh petunjuk?</button><span>Kesempatan {Math.min(attempts + 1, 2)} dari 2</span></div>
        {hint && <p id="fraction-hint" className={styles.hint}>Angka bawah menunjukkan semua bagian. Angka atas menunjukkan berapa bagian yang perlu diwarnai.</p>}
        <div role="status" aria-live="polite" className={`${styles.feedback} ${feedback === "correct" ? styles.success : ""}`}>
          {feedback === "correct" ? "Tepat! Kamu sudah memilih bagian yang sesuai." : feedback === "wrong" ? locked ? `Yuk, lihat lagi: ${question.top}/${question.bottom} berarti ${question.top} dari ${question.bottom} bagian sama besar.` : "Belum pas. Lihat angka atas, lalu coba pilih lagi." : ""}
        </div>
        <footer className={styles.actions}><button className={styles.clear} disabled={locked || selected.length === 0} onClick={() => { setSelected([]); setFeedback(null); }}><RotateCcw size={18} /> Ulangi pilihan</button>{locked ? <button className={styles.primary} onClick={() => { if (step === examples.length - 1) setFinished(true); else { setStep(step + 1); reset(); } }}> {step === examples.length - 1 ? "Selesai" : "Soal berikutnya"}<ArrowRight size={19} /></button> : <button className={styles.primary} disabled={selected.length === 0 || feedback === "wrong"} onClick={() => { setAttempts(attempts + 1); setFeedback(selected.length === question.top ? "correct" : "wrong"); }}>Periksa <Check size={19} /></button>}</footer>
      </>}
    </section>
    <p className={styles.footnote}>Pelan-pelan juga boleh. Ayo coba satu langkah dulu.</p>
  </main>;
}
