"use client";
import {useState} from 'react';
import MatchingCards from './MatchingCards';
export default function MatchingPreview(){const [answer,setAnswer]=useState<Record<string,string>>({});return <MatchingCards targets={[{id:'a',label:'Dua buah'},{id:'b',label:'Tiga buah'}]} items={[{id:'two',label:'🍎🍎'},{id:'three',label:'🍎🍎🍎'}]} value={JSON.stringify(answer)} disabled={false} onChange={(target,item)=>setAnswer(previous=>({...previous,[target]:item}))}/>;}
