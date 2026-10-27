import type { Metadata } from 'next';
import CountingVisual from '@/components/learning/CountingVisual';
import VisualArithmetic from '@/components/learning/VisualArithmetic';
export const metadata: Metadata = { title: 'Contoh visual kelas 1', robots: { index: false, follow: false } };
export default function Page() {
  return <main className="mx-auto max-w-3xl space-y-8 p-4 sm:p-8"><header><h1 className="text-2xl font-extrabold text-emerald-900">Ayo bermain dengan angka</h1><p className="mt-2 text-slate-600">Contoh desain • Tidak menyimpan jawaban</p></header>{[0, 1, 2].map(variation => <section key={variation}><h2 className="text-xl font-bold">5 − 2</h2><VisualArithmetic prompt="5 - 2 = ?" variation={variation} /></section>)}<section><h2 className="text-xl font-bold">3 + 4</h2><VisualArithmetic prompt="3 + 4 = ?" variation={0} /></section><section><h2 className="text-xl font-bold">Ada berapa apel?</h2><CountingVisual prompt="🍎🍎🍎🍎🍎 ada berapa?" /></section></main>;
}
