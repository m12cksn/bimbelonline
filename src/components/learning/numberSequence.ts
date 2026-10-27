export function parseNumberSequence(prompt: string): (number | null)[] | null {
  const match = prompt.trim().match(/^(?:Lengkapi(?: angka yang kosong| angka berikut| Bilangan yang kosong)?|Isilah angka yang kosong|Hitung(?: mundur)?)\s*:\s*(.+)$/iu);
  if (!match) return null;
  const tokens = match[1].split(',').map(token => token.trim());
  if (tokens.length < 3 || tokens.length > 10) return null;
  const values: (number | null)[] = [];
  for (const token of tokens) {
    if (/^(?:_{2,}|(?:\.\s*){2,}|…)$/.test(token)) values.push(null);
    else if (/^(?:0|[1-9]\d?)$/.test(token) && Number(token) <= 20) values.push(Number(token));
    else return null;
  }
  if (values.filter(value => value === null).length !== 1) return null;
  return values;
}
