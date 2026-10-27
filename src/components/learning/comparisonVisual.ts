const patterns = [
  /^(?:Mana lebih besar|manakah angka yang lebih kecil)\s*:\s*(\d{1,2}) atau (\d{1,2})\??$/iu,
  /^Bandingkan:\s*(\d{1,2}) dan (\d{1,2})\. Mana lebih banyak\?$/iu,
  /^(?:Selisih|Beda(?: banyak)?) (\d{1,2}) dan (\d{1,2}) adalah\.{3}$/iu,
  /^Bandingkan:\s*(\d{1,2}) \.{2,} (\d{1,2}) \(isi dengan < atau >\)$/iu,
  /^Lebih dari\/kuran g dari:\s*(\d{1,2}) __ (\d{1,2}) \(isi < atau >\)$/iu,
  /^(\d{1,2}) lebih \.{3} dari (\d{1,2}) \(isi lebih\/kurang\)$/iu,
];
export function parseComparisonVisual(prompt: string) {
  for (const pattern of patterns) {
    const match = prompt.trim().match(pattern);
    if (match) {
      const left = Number(match[1]), right = Number(match[2]);
      return left <= 20 && right <= 20 ? { left, right } : null;
    }
  }
  return null;
}
