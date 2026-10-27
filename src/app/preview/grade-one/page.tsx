import type { Metadata } from 'next';
import OrderingPreview from "@/components/learning/OrderingPreview";
import MatchingPreview from "@/components/learning/MatchingPreview";
import PlaceValue from "@/components/learning/PlaceValue";
import ShapeVisual from "@/components/learning/ShapeVisual";
import ComparisonVisual from "@/components/learning/ComparisonVisual";
import NumberSequence from "@/components/learning/NumberSequence";
import CountingVisual from '@/components/learning/CountingVisual';
import VisualArithmetic from '@/components/learning/VisualArithmetic';
export const metadata: Metadata = { title: 'Contoh visual kelas 1', robots: { index: false, follow: false } };
export default function Page() {
  return <main className="mx-auto max-w-3xl space-y-8 p-4 sm:p-8"><header><h1 className="text-2xl font-extrabold text-emerald-900">Ayo bermain dengan angka</h1><p className="mt-2 text-slate-600">Contoh desain • Tidak menyimpan jawaban</p></header>{[0, 1, 2].map(variation => <section key={variation}><h2 className="text-xl font-bold">5 − 2</h2><VisualArithmetic prompt="5 - 2 = ?" variation={variation} /></section>)}<section><h2 className="text-xl font-bold">3 + 4</h2><VisualArithmetic prompt="3 + 4 = ?" variation={0} /></section><section><h2 className="text-xl font-bold">Ada berapa apel?</h2><CountingVisual prompt="🍎🍎🍎🍎🍎 ada berapa?" /></section><section><h2 className="text-xl font-bold">Lengkapi urutan</h2><NumberSequence prompt="Lengkapi: 1,2,...,4,5" /></section><section><h2 className="text-xl font-bold">Bandingkan dua kelompok</h2><ComparisonVisual prompt="Mana lebih besar: 12 atau 18?" /></section><section><h2 className="text-xl font-bold">Amati bentuk</h2><ShapeVisual prompt="Lingkari semua segi empat: ⬛ ⚪ ⬛ 📐 (berapa segi empat?)" /></section><section><h2 className="text-xl font-bold">Cerita apel</h2><p>Ada 15 apel, dimakan 3. Berapa sisanya?</p><VisualArithmetic prompt="Ada 15 🍎, dimakan 3. Sisa?" variation={0} /></section><section><h2 className="text-xl font-bold">Puluhan dan satuan</h2><PlaceValue prompt="Nilai tempat 14 = ... puluhan + ... satuan" /></section><section><h2 className="text-xl font-bold">Hitung bola</h2><VisualArithmetic prompt="⚽⚽⚽⚽+⚽⚽ ada berapa bola pada gambar ?" variation={0} /></section><section><h2 className="text-xl font-bold">Pasangkan kartu</h2><MatchingPreview /></section><section><h2 className="text-xl font-bold">Susun angka</h2><OrderingPreview /></section></main>;
}
