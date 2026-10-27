export function parseMissingAddend(prompt: string): { left: number | null; right: number | null; total: number } | null {
  const match = prompt.trim().match(/^Lengkapi angka yang kosong (\d{1,2}|\.{3,4}) \+ (\d{1,2}|\.{3,4}) = (\d{1,2})$/u);
  if (!match) return null;
  const left = match[1].startsWith('.') ? null : Number(match[1]);
  const right = match[2].startsWith('.') ? null : Number(match[2]);
  const total = Number(match[3]);
  if ((left === null) === (right === null) || total > 20 || (left ?? right ?? 0) > total) return null;
  return { left, right, total };
}
