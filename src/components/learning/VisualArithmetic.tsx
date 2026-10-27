"use client";
import { useState } from 'react';
import { parseVisualArithmetic } from './visualArithmetic';
import styles from './visualArithmetic.module.css';
const themes = [
  { title: 'Kebun buah', object: '🍎', noun: 'apel', destination: 'Keranjang' },
  { title: 'Akuarium', object: '🐠', noun: 'ikan', destination: 'Akuarium kecil' },
  { title: 'Rak mainan', object: '🧸', noun: 'boneka', destination: 'Kotak mainan' },
];
export default function VisualArithmetic({ prompt, variation }: { prompt: string; variation: number }) {
  const config = parseVisualArithmetic(prompt);
  const [marked, setMarked] = useState<number[]>([]);
  if (!config) return null;
  const theme = themes[Math.abs(variation) % themes.length];
  const subtract = config.operation === 'subtract';
  const total = subtract ? config.left : config.left + config.right;
  const ids = Array.from({ length: total }, (_, index) => index);
  const toggle = (index: number) => setMarked(previous => previous.includes(index) ? previous.filter(i => i !== index) : subtract && previous.length >= config.right ? previous : [...previous, index]);
  const object = (index: number) => <button type="button" key={index} aria-label={`${theme.noun} ${index + 1}${subtract ? marked.includes(index) ? ', kembalikan' : ', pindahkan' : `, kelompok ${index < config.left ? 1 : 2}`}`} aria-pressed={marked.includes(index)} className={`${styles.object} ${!subtract && index >= config.left ? styles.second : ''} ${marked.includes(index) ? styles.marked : ''}`} onClick={() => toggle(index)}><span aria-hidden="true">{theme.object}</span>{!subtract && marked.includes(index) && <span className={styles.tick} aria-hidden="true">✓</span>}</button>;
  return <section className={styles.scene} aria-label={`Alat bantu ${theme.title}`}>
    <div className={styles.top}><strong>{theme.title}</strong><button type="button" onClick={() => setMarked([])}>Ulangi</button></div>
    <p>{subtract ? `Sentuh untuk memindahkan ${config.right} ${theme.noun}.` : `Hitung dua kelompok ${theme.noun} ini.`}</p>
    {subtract ? <>
      <div className={styles.zone}><strong>Tempat semula</strong><div className={styles.objects} role="group" aria-label="Benda yang tersisa">{ids.map(index => marked.includes(index) ? <span key={index} className={styles.empty} aria-hidden="true" /> : object(index))}</div>{total === 0 && <p>Tidak ada benda.</p>}</div>
      <div className={styles.destination}><strong>{theme.destination}</strong><div className={styles.objects} role="group" aria-label="Benda yang dipindahkan">{marked.map(object)}</div></div>
      <p role="status" className={styles.caption}>{marked.length} dari {config.right} benda dipindahkan. {marked.length === config.right ? 'Sekarang hitung benda yang masih di tempat semula.' : 'Sentuh benda di bawah untuk mengembalikannya.'}</p>
    </> : <div className={styles.addition}>{[0, 1].map(group => <div className={styles.zone} key={group}><strong>Kelompok {group + 1}</strong><div className={styles.objects} role="group" aria-label={`Kelompok ${group + 1}`}>{ids.filter(index => group === 0 ? index < config.left : index >= config.left).map(object)}</div>{(group === 0 ? config.left : config.right) === 0 && <p>Tidak ada benda.</p>}</div>)}</div>}
    <p className={styles.caption}>Pilih atau tulis jawabanmu di bawah.</p>
  </section>;
}
