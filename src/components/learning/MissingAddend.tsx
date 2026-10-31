"use client";
import { useState } from 'react';
import { parseMissingAddend } from './missingAddend';
import styles from './missingAddend.module.css';
export default function MissingAddend({prompt,answer="",onAnswerChange,disabled=false,compact=false}:{prompt:string;compact?:boolean;answer?:string;onAnswerChange?:(value:string)=>void;disabled?:boolean}) {
  const config = parseMissingAddend(prompt);
  const [marked,setMarked] = useState<number[]>([]);
  if (!config) return null;
  const group = (value:number|null,label:string) => <div className={styles.group}><strong>{label}</strong>{value === null ? onAnswerChange ? <input style={{width:80,minHeight:56,textAlign:"center",border:"2px solid #15803d",borderRadius:8,background:"white",fontSize:28,color:"#173c2b"}} type="text" inputMode="numeric" autoComplete="off" aria-label={`Jumlah pada ${label.toLowerCase()}`} placeholder="?" value={answer} disabled={disabled} onChange={event=>onAnswerChange(event.target.value)} /> : <span className={styles.unknown} aria-label="Jumlah belum diketahui">?</span> : <><span className={styles.objects} aria-hidden="true">{'🍎'.repeat(value)}</span><span>{value} apel</span></>}</div>;
  return <section className={styles.scene} aria-label="Penjumlahan dengan angka yang hilang">{!compact && <div className={styles.heading}><strong>Berapa yang belum ada?</strong><button type="button" onClick={()=>setMarked([])}>Ulangi tanda</button></div>}<div className={styles.equation}>{group(config.left,'Kelompok pertama')}<span aria-hidden="true">+</span>{group(config.right,'Kelompok kedua')}</div><p>Jumlah semuanya: {config.total} apel.{!compact && " Ketuk untuk menandai."}</p>{!compact && <div className={styles.total}>{Array.from({length:config.total},(_,i)=><button key={i} type="button" aria-label={`Apel ${i+1}`} aria-pressed={marked.includes(i)} onClick={()=>setMarked(old=>old.includes(i)?old.filter(n=>n!==i):[...old,i])}>🍎<span aria-hidden="true">{marked.includes(i)?'✓':''}</span></button>)}</div>}{!onAnswerChange && <p>Tulis angka yang hilang di bagian jawaban.</p>}</section>;
}
