"use client";
import Image from 'next/image';
import {useId,useState} from 'react';
import {DndContext,DragOverlay,PointerSensor,useSensor,useSensors,useDraggable,useDroppable,type DragEndEvent} from '@dnd-kit/core';
import styles from './matchingCards.module.css';
type Item={id:string;label:string;image_url?:string|null};
type Target={id:string;label:string;placeholder?:string|null};
function Choice({item,targetId,active,used,disabled,onSelect}:{item:Item;targetId:string;active:boolean;used:boolean;disabled:boolean;onSelect:()=>void}) {
  const {attributes,listeners,setNodeRef,transform,isDragging}=useDraggable({id:JSON.stringify([targetId,item.id]),data:{itemId:item.id},disabled:disabled||used||active});
  return <div ref={setNodeRef} className={styles.choice} style={{opacity:isDragging?.4:1,transform:transform?`translate3d(${transform.x}px,${transform.y}px,0)`:undefined}}><button type="button" aria-pressed={active} disabled={disabled||used} onClick={onSelect} className={styles.card}>{item.image_url&&<span className={styles.image}><Image src={item.image_url} alt="" fill sizes="160px" className="object-contain" unoptimized/></span>}<span>{item.label}</span>{active&&<span className={styles.selected}>✓ Dipilih</span>}{used&&<span className={styles.used}>Sudah dipakai</span>}</button><button type="button" className={styles.handle} disabled={disabled||used||active} {...attributes} {...listeners} aria-label={`Seret ${item.label}; atau gunakan tombol kartu untuk memilih`}>⠿ Seret</button></div>;
}
function Group({target,items,selected,disabled,onChange}:{target:Target;items:Item[];selected:Record<string,string>;disabled:boolean;onChange:(targetId:string,itemId:string)=>void}) {
  const {setNodeRef,isOver}=useDroppable({id:target.id,disabled});
  return <fieldset ref={setNodeRef} className={`${styles.target} ${isOver?styles.over:''}`} disabled={disabled}><legend>{target.label}</legend><p className={styles.hint}>Letakkan kartu di sini, atau pilih kartu di bawah.</p><div className={styles.cards}>{items.map(item=><Choice key={item.id} item={item} targetId={target.id} active={selected[target.id]===item.id} used={Object.entries(selected).some(([id,value])=>id!==target.id&&value===item.id)} disabled={disabled} onSelect={()=>onChange(target.id,selected[target.id]===item.id?'':item.id)}/>)}</div></fieldset>;
}
export default function MatchingCards({targets,items,value,disabled,onChange}:{targets:Target[];items:Item[];value:string;disabled:boolean;onChange:(targetId:string,itemId:string)=>void}) {
  const id=useId();
  const [dragItem,setDragItem]=useState<string|null>(null);
  const [status,setStatus]=useState('');
  const sensors=useSensors(useSensor(PointerSensor,{activationConstraint:{distance:8}}));
  let selected:Record<string,string>={};
  try {const parsed:unknown=JSON.parse(value||'{}');if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))selected=Object.fromEntries(Object.entries(parsed).filter(([,v])=>typeof v==='string'));} catch { /* Empty until valid answer is provided. */ }
  function finish(event:DragEndEvent){setDragItem(null);if(disabled||!event.over)return;const target=targets.find(t=>t.id===event.over?.id);const item=items.find(i=>i.id===event.active.data.current?.itemId);if(!target||!item)return;if(Object.entries(selected).some(([key,value])=>key!==target.id&&value===item.id)){setStatus('Batalkan pilihan sebelumnya untuk memindahkan kartu ini.');return;}onChange(target.id,item.id);setStatus(`Kartu ${item.label} dipilih untuk ${target.label}.`);}
  return <DndContext id={id} sensors={sensors} onDragStart={event=>setDragItem(String(event.active.data.current?.itemId??''))} onDragCancel={()=>setDragItem(null)} onDragEnd={finish}><div className={styles.scene}><p>Seret pegangan kartu ke kelompok tujuan, atau sentuh kartunya.</p>{targets.map(target=><Group key={target.id} target={target} items={items} selected={selected} disabled={disabled} onChange={onChange}/>)}<p className={styles.hint}>Sentuh kartu yang dipilih lagi untuk membatalkan.</p><p role="status" className={styles.hint}>{status}</p></div><DragOverlay>{dragItem&&<div className={styles.overlay}>{items.find(item=>item.id===dragItem)?.label}</div>}</DragOverlay></DndContext>;
}
