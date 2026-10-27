"use client";
import {useRef,useLayoutEffect} from 'react';
import {parseNumberOrdering,selectedOrderingValues} from './numberOrdering';
import styles from './numberOrdering.module.css';
export default function NumberOrdering({prompt,value,disabled,onChange}:{prompt:string;value:string;disabled:boolean;onChange:(value:string)=>void}){
  const pendingFocus=useRef<string|null>(null);
  const controls=useRef(new Map<string,HTMLButtonElement>());
  useLayoutEffect(()=>{if(pendingFocus.current){controls.current.get(pendingFocus.current)?.focus();pendingFocus.current=null;}},[value]);
  const config=parseNumberOrdering(prompt);
  if(!config)return null;
  const selected=selectedOrderingValues(value,config.values);
  return <section className={styles.scene} aria-label="Susun kartu angka"><strong>Susun dari {config.direction}</strong><p>Sentuh kartu sesuai urutan yang kamu pilih.</p><div className={styles.cards} role="group" aria-label="Kartu yang tersedia">{config.values.map(number=><button type="button" key={number} ref={element=>{if(element)controls.current.set(`source-${number}`,element);else controls.current.delete(`source-${number}`);}} className={styles.card} disabled={disabled||selected.includes(number)} onClick={()=>{pendingFocus.current=`slot-${selected.length}`;onChange([...selected,number].join(', '));}}>{number}</button>)}</div><ol className={styles.slots} aria-label="Urutan jawabanmu">{config.values.map((_,index)=><li key={index}>{selected[index]===undefined?<span className={styles.empty} aria-label={`Posisi ${index+1} kosong`}>?</span>:<button type="button" ref={element=>{if(element)controls.current.set(`slot-${index}`,element);else controls.current.delete(`slot-${index}`);}} className={styles.chosen} disabled={disabled} aria-label={`Posisi ${index+1}: ${selected[index]}, batalkan`} onClick={()=>{pendingFocus.current=`source-${selected[index]}`;onChange(selected.filter((_,i)=>i!==index).join(', '));}}>{selected[index]}</button>}</li>)}</ol><button type="button" className={styles.reset} disabled={disabled||!value} onClick={()=>{pendingFocus.current=`source-${config.values[0]}`;onChange('');}}>Ulangi susunan</button><p role="status" className={styles.caption}>{selected.length} dari {config.values.length} kartu dipilih. Susunanmu akan diperiksa saat menekan tombol Periksa jawaban.</p></section>;
}
