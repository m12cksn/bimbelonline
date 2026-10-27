"use client";
import { useState } from 'react';
import { parseComparisonVisual } from './comparisonVisual';
import styles from './comparisonVisual.module.css';
export default function ComparisonVisual({ prompt }: { prompt: string }) {
  const config = parseComparisonVisual(prompt);
  const [marked, setMarked] = useState<string[]>([]);
  if (!config) return null;
  return <section className={styles.scene} aria-label="Bandingkan dua kelompok benda">
    <div className={styles.heading}><strong>Lihat dua kelompok ini</strong><button type="button" onClick={() => setMarked([])}>Ulangi</button></div>
    <p>Sentuh benda untuk menandai yang sudah dihitung.</p>
    {[config.left, config.right].map((count, group) => <div key={group} className={styles.row}><strong>Kelompok {group + 1}: {count}</strong><div className={styles.grid} role="group" aria-label={`Kelompok ${group + 1}, ${count} benda`}>{Array.from({ length: 20 }, (_, index) => {
      const key = `${group}-${index}`;
      return index < count ? <button key={key} type="button" aria-label={`Kelompok ${group + 1}, benda ${index + 1}`} aria-pressed={marked.includes(key)} className={`${styles.object} ${group === 1 ? styles.second : ''}`} onClick={() => setMarked(previous => previous.includes(key) ? previous.filter(value => value !== key) : [...previous, key])}><span aria-hidden="true">{marked.includes(key) ? '✓' : '●'}</span></button> : <span key={key} aria-hidden="true" className={styles.empty} />;
    })}</div>{count === 0 && <p>Tidak ada benda.</p>}</div>)}
    <p className={styles.caption}>Setiap kotak berisi satu benda. Bandingkan, lalu jawab di bawah.</p>
  </section>;
}
