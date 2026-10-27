"use client";
import { useState } from 'react';
import { parseCountingVisual } from './countingVisual';
import styles from './visualArithmetic.module.css';
export default function CountingVisual({ prompt }: { prompt: string }) {
  const config = parseCountingVisual(prompt);
  const [marked, setMarked] = useState<number[]>([]);
  if (!config) return null;
  return <section className={styles.scene} aria-label={`Gambar ${config.name} untuk dihitung`}>
    <div className={styles.top}><strong>Ayo hitung!</strong><button type="button" onClick={() => setMarked([])}>Ulangi</button></div>
    <p>Sentuh setiap {config.name} satu kali.</p>
    <div className={styles.objects} role="group" aria-label="Benda untuk dihitung">{Array.from({ length: config.count }, (_, index) => <button type="button" key={index} className={`${styles.object} ${marked.includes(index) ? styles.marked : ''}`} aria-label={`${config.name} ${index + 1}`} aria-pressed={marked.includes(index)} onClick={() => setMarked(previous => previous.includes(index) ? previous.filter(i => i !== index) : [...previous, index])}><span aria-hidden="true">{config.icon}</span>{marked.includes(index) && <span className={styles.tick} aria-hidden="true">✓</span>}</button>)}</div>
    <p className={styles.caption}>Tanda centang berarti sudah kamu hitung. Tulis atau pilih jumlahnya di bawah.</p>
  </section>;
}
