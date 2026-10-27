"use client";
import { useState } from 'react';
import { parseVisualArithmetic } from './visualArithmetic';
import styles from './visualArithmetic.module.css';
const themes = [
  { title: 'Kebun buah', object: '🍎', noun: 'apel', destination: 'keranjang' },
  { title: 'Akuarium', object: '🐠', noun: 'ikan', destination: 'akuarium kecil' },
  { title: 'Rak mainan', object: '🧸', noun: 'boneka', destination: 'kotak' },
];
export default function VisualArithmetic({ prompt, variation }: { prompt: string; variation: number }) {
  const config = parseVisualArithmetic(prompt);
  const [marked, setMarked] = useState<number[]>([]);
  if (!config) return null;
  const theme = themes[Math.abs(variation) % themes.length];
  const total = config.operation === 'add' ? config.left + config.right : config.left;
  const toggle = (index: number) => setMarked(previous => previous.includes(index) ? previous.filter(i => i !== index) : config.operation === 'subtract' && previous.length >= config.right ? previous : [...previous, index]);
  return <section className={styles.scene} aria-label={`Alat bantu ${theme.title}`}>
    <div className={styles.top}><strong>{theme.title}</strong><button type="button" onClick={() => setMarked([])}>Ulangi</button></div>
    <p>{config.operation === 'add' ? `Sentuh dan hitung ${config.left} + ${config.right} ${theme.noun}.` : `Pindahkan ${config.right} ${theme.noun} ke ${theme.destination}.`}</p>
    <div className={styles.objects} role="group" aria-label={`${total} ${theme.noun}`}>
      {Array.from({ length: total }, (_, index) => <button type="button" key={index} aria-label={`${theme.noun} ${index + 1}${config.operation === 'add' ? `, kelompok ${index < config.left ? 1 : 2}` : ''}`} aria-pressed={marked.includes(index)} className={`${styles.object} ${index >= config.left ? styles.second : ''} ${marked.includes(index) ? styles.marked : ''}`} onClick={() => toggle(index)}><span aria-hidden="true">{theme.object}</span>{marked.includes(index) && <span className={styles.tick} aria-hidden="true">✓</span>}</button>)}
    </div>
    <p className={styles.caption}>{config.operation === 'add' ? 'Warna bingkai membedakan dua kelompok. Tanda centang berarti sudah kamu hitung.' : 'Tanda centang berarti sudah kamu pindahkan. Hitung benda yang belum bertanda.'}</p>
    <p className={styles.caption}>Pilih atau tulis jawabanmu di bawah.</p>
  </section>;
}
