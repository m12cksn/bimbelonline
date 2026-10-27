"use client";
import { useState } from 'react';
import { parseNumberSequence } from './numberSequence';
import styles from './numberSequence.module.css';
export default function NumberSequence({ prompt }: { prompt: string }) {
  const values = parseNumberSequence(prompt);
  const [active, setActive] = useState<number | null>(null);
  if (!values) return null;
  return <section className={styles.scene} aria-label="Rangkaian angka">
    <div className={styles.heading}><strong>Kereta angka</strong><button type="button" onClick={() => setActive(null)}>Ulangi</button></div>
    <p>Ikuti angkanya. Angka apa yang hilang?</p>
    <ol className={styles.train}>{values.map((value, index) => <li key={index}><button type="button" aria-label={`Posisi ${index + 1}: ${value === null ? 'angka kosong' : value}`} aria-pressed={active === index} onClick={() => setActive(index)} className={`${styles.wagon} ${value === null ? styles.blank : ''} ${active === index ? styles.active : ''}`}><span>{value ?? '?'}</span><span className={styles.wheels} aria-hidden="true">●　●</span></button></li>)}</ol>
    <p className={styles.caption}>Pilih atau tulis angka yang hilang di bagian jawaban.</p>
  </section>;
}
