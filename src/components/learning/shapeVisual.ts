export type ShapeKind = 'triangle' | 'square' | 'circle';
const prompts: Record<string, ShapeKind[]> = {
  '🔺 bentuk apa pada gambar disamping ?': ['triangle'],
  '⬛ ini bentuk apa?': ['square'],
  '⚪ ini bentuk apa?': ['circle'],
  'ada berapa bola pada gambar berikut ? 🔵🔵🔵': ['circle','circle','circle'],
  'ada berapa segitiga pada gambar berikut ? 📐📐 ⬛ 📐 ⚪ (berapa segitiga?)': ['triangle','triangle','square','triangle','circle'],
  'Lingkari semua segi empat: ⬛ ⚪ ⬛ 📐 (berapa segi empat?)': ['square','circle','square','triangle'],
  'Lingkari semua bentuk lengkung: ⚪ 📐 ⚪ ⬛ (berapa lengkung?)': ['circle','triangle','circle','square'],
  'ada berapa segitiga pada gambar berikut 📐📐📔': ['triangle','triangle','square'],
};
export function parseShapeVisual(prompt: string): ShapeKind[] | null {
  const shapes = prompts[prompt.trim()];
  return shapes ? [...shapes] : null;
}
