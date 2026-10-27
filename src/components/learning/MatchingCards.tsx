"use client";
import Image from 'next/image';
import styles from './matchingCards.module.css';
type Item={id:string;label:string;image_url?:string|null};
type Target={id:string;label:string;placeholder?:string|null};
export default function MatchingCards({targets,items,value,disabled,onChange}:{targets:Target[];items:Item[];value:string;disabled:boolean;onChange:(targetId:string,itemId:string)=>void}) {
  let selected:Record<string,string>={};
  try { const parsed:unknown=JSON.parse(value||'{}');if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))selected=Object.fromEntries(Object.entries(parsed).filter(([,v])=>typeof v==='string')); } catch { /* Keep an empty selection until a valid answer is supplied. */ }
  return <div className={styles.scene}><p>Pilih satu kartu untuk setiap kelompok.</p>{targets.map(target=><fieldset key={target.id} className={styles.target} disabled={disabled}><legend>{target.label}</legend><div className={styles.cards}>{items.map(item=>{
    const active=selected[target.id]===item.id;
    const used=Object.entries(selected).some(([id,value])=>id!==target.id&&value===item.id);
    return <button type="button" key={item.id} aria-pressed={active} disabled={disabled||used} onClick={()=>onChange(target.id,active?'':item.id)} className={styles.card}>{item.image_url&&<span className={styles.image}><Image src={item.image_url} alt="" fill sizes="160px" className="object-contain" unoptimized/></span>}<span>{item.label}</span>{active&&<span className={styles.selected}>✓ Dipilih</span>}{used&&<span className={styles.used}>Sudah dipakai</span>}</button>;
  })}</div></fieldset>)}<p className={styles.hint}>Sentuh kartu yang dipilih lagi untuk membatalkan.</p></div>;
}
