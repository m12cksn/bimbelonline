"use client";
import { useState } from 'react';
import { parseShapeVisual, type ShapeKind } from './shapeVisual';
import styles from './shapeVisual.module.css';
const descriptions: Record<ShapeKind,string> = {triangle:'bidang merah dengan tiga sisi lurus',square:'bidang biru dengan empat sisi sama panjang',circle:'bidang kuning dengan tepi melengkung'};
export default function ShapeVisual({ prompt }: {prompt:string}) {
  const shapes = parseShapeVisual(prompt);
  const [selected,setSelected] = useState<number[]>([]);
  if (!shapes) return null;
  return <section className={styles.scene} aria-label="Gambar bentuk untuk diamati"><div className={styles.heading}><strong>Ayo amati bentuknya</strong><button type="button" onClick={()=>setSelected([])}>Ulangi</button></div><p>Sentuh bentuk untuk memberi tanda.</p><div className={styles.shapes}>{shapes.map((shape,index)=><button key={index} type="button" aria-label={`Gambar ${index+1}: ${descriptions[shape]}`} aria-pressed={selected.includes(index)} className={styles.shape} onClick={()=>setSelected(previous=>previous.includes(index)?previous.filter(i=>i!==index):[...previous,index])}><svg viewBox="0 0 120 120" aria-hidden="true">{shape==='triangle'?<polygon points="60,14 108,100 12,100" fill="#f87171" stroke="#9f1239" strokeWidth="4"/>:shape==='square'?<rect x="18" y="18" width="84" height="84" fill="#7dd3fc" stroke="#075985" strokeWidth="4"/>:<circle cx="60" cy="60" r="43" fill="#fde047" stroke="#854d0e" strokeWidth="4"/>}</svg>{selected.includes(index)&&<span className={styles.tick} aria-hidden="true">✓</span>}</button>)}</div><p className={styles.caption}>Tanda ini hanya untuk membantumu mengamati. Jawab soalnya di bawah.</p></section>;
}
