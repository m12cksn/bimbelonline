"use client";
import {contextualAnswer} from './contextualAnswer';
import styles from './contextualAnswer.module.css';
export default function ContextualAnswer({prompt,value,disabled,onChange}:{prompt:string;value:string;disabled:boolean;onChange:(value:string)=>void}){
 const config=contextualAnswer(prompt);
 if(!config)return null;
 const input=<input type="text" inputMode="numeric" autoComplete="off" aria-label={config.kind==='equation'?'Hasil perhitungan':`Jumlah ${config.noun}`} placeholder="?" value={value} disabled={disabled} onChange={event=>onChange(event.target.value)} className={styles.input}/>;
 return <div className={styles.answer}>{config.kind==='equation'?<><span>{config.left} {config.operator} {config.right} =</span>{input}</>:<><span>Ada</span>{input}<span>{config.noun}</span></>}</div>;
}
