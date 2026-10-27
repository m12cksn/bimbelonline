export function parseNumberOrdering(prompt:string) {
  const match=prompt.trim().match(/^Urutkan dari (kecil ke besar|besar ke kecil):\s*(\d{1,2}(?:\s*,\s*\d{1,2}){2,7})$/iu);
  if(!match)return null;
  const values=match[2].split(',').map(Number);
  if(values.some(value=>value>20)||new Set(values).size!==values.length)return null;
  return {values,direction:match[1].toLowerCase() as 'kecil ke besar'|'besar ke kecil'};
}
export function selectedOrderingValues(answer:string,values:number[]):number[]{
  if(!/^\d+(?:\s*,\s*\d+)*$/.test(answer.trim()))return [];
  const selected=answer.split(',').map(Number);
  return selected.every(value=>values.includes(value))&&new Set(selected).size===selected.length?selected:[];
}
