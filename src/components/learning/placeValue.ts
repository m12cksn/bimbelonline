export function parsePlaceValue(prompt:string) {
  const text=prompt.trim();
  let match=text.match(/^Nilai tempat (\d{1,2})(?: = \.{3} puluhan \+ \.{3} satuan| adalah\.{3})$/u) ?? text.match(/^Bilangan (\d{1,2}) terdiri dari\.{3}$/u);
  if(match){const total=Number(match[1]);return total>=10&&total<=20?{tens:Math.floor(total/10),ones:total%10}:null;}
  match=text.match(/^Ada ([0-2]) puluhan dan ([0-9]) satuan(?:, sebutkan angka tersebut\.{3}| = \?)$/u);
  if(!match)return null;
  const tens=Number(match[1]),ones=Number(match[2]);
  return tens*10+ones<=20?{tens,ones}:null;
}
