"use client";
import {useState} from 'react';
import NumberOrdering from './NumberOrdering';
export default function OrderingPreview(){const [value,setValue]=useState('');return <NumberOrdering prompt="Urutkan dari kecil ke besar: 13, 18, 11" value={value} disabled={false} onChange={setValue}/>;}
