"use client";
import { useState } from 'react';
import { parseNumberSequence } from './numberSequence';
import styles from './numberSequence.module.css';
type Props = {prompt:string; answer?:string; onAnswerChange?:(value:string)=>void; disabled?:boolean};
export default function NumberSequence({prompt,answer='',onAnswerChange,disabled=false}:Props) {
  const values=parseNumberSequence(prompt);
  const [active,setActive]=useState<number|null>(null);
  if(!values)return null;
  const inline=Boolean(onAnswerChange);
  return <section className={styles.scene} aria-label="Rangkaian angka">
    <div className={styles.heading}><strong>Kereta angka</strong>{!inline && <button type="button" onClick={()=>setActive(null)}>Ulangi</button>}</div>
    <p>{inline?'Isi angka pada gerbong kosong.':'Ikuti angkanya. Angka apa yang hilang?'}</p>
    <ol className={styles.train}>{values.map((value,index)=><li key={index}>
      {value===null && inline ? <div className={`${styles.wagon} ${styles.blank}`}>
        <input className={styles.answer} type="text" inputMode="numeric" autoComplete="off" aria-label={`Angka pada gerbong ke-${index+1}`} placeholder="...." value={answer} disabled={disabled} onChange={event=>onAnswerChange?.(event.target.value)} />
        <span className={styles.wheels} aria-hidden="true">●　●</span>
      </div> : <button type="button" aria-label={`Posisi ${index+1}: ${value===null?'angka kosong':value}`} aria-pressed={active===index} onClick={()=>setActive(index)} className={`${styles.wagon} ${value===null?styles.blank:''} ${active===index?styles.active:''}`}><span>{value??'....'}</span><span className={styles.wheels} aria-hidden="true">●　●</span></button>}
    </li>)}</ol>
    {!inline && <p className={styles.caption}>Pilih atau tulis angka yang hilang di bagian jawaban.</p>}
  </section>;
}
