"use client";
import { useState } from 'react';
import { parsePlaceValue } from './placeValue';
import styles from './placeValue.module.css';
export default function PlaceValue({prompt}:{prompt:string}) {
  const config=parsePlaceValue(prompt);
  const [opened,setOpened]=useState<number[]>([]);
  if(!config)return null;
  return <section className={styles.scene} aria-label="Alat bantu puluhan dan satuan"><strong>Ayo lihat kelompoknya</strong><p>Setiap ikatan berisi sepuluh batang. Sentuh untuk membuka atau mengikatnya lagi.</p><div className={styles.columns}><div className={styles.column}><h4>Puluhan</h4><div className={styles.bundles}>{Array.from({length:config.tens},(_,index)=><button type="button" key={index} className={`${styles.bundle} ${opened.includes(index)?styles.open:''}`} aria-label={`Ikatan ${index+1}, sepuluh batang`} aria-pressed={opened.includes(index)} onClick={()=>setOpened(previous=>previous.includes(index)?previous.filter(i=>i!==index):[...previous,index])}>{Array.from({length:10},(_,i)=><span key={i} aria-hidden="true"/>)}<span className={styles.tie} aria-hidden="true"/></button>)}</div>{config.tens===0&&<p>Tidak ada ikatan.</p>}</div><div className={styles.column}><h4>Satuan</h4><div className={styles.ones} role="img" aria-label={`${config.ones} batang lepas`}>{Array.from({length:config.ones},(_,index)=><span key={index} aria-hidden="true"/>)}</div>{config.ones===0&&<p>Tidak ada batang lepas.</p>}</div></div><p className={styles.caption}>Amati ikatan dan batang lepas, lalu jawab di bawah.</p></section>;
}
