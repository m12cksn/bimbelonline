export function parseVisualArithmetic(prompt: string) {
  const match = prompt.trim().match(/^(\d{1,2})\s*([+−-])\s*(\d{1,2})\s*=\s*(?:\?|\.{3}|…)\s*$/u);
  if (!match) return null;
  const left = Number(match[1]), right = Number(match[3]);
  const operation = match[2] === '+' ? 'add' : 'subtract';
  if (left > 20 || right > 20 || (operation === 'add' ? left + right > 20 : right > left)) return null;
  return { left, right, operation } as const;
}
