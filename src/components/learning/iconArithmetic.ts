const objects = [
  {icon:'🍌',noun:'pisang'}, {icon:'⭐',noun:'bintang'}, {icon:'🍎',noun:'apel'}, {icon:'🐟',noun:'ikan'}, {icon:'⚽',noun:'bola'},
  {icon:'🎈',noun:'balon'}, {icon:'🐱',noun:'kucing'}, {icon:'🍪',noun:'kue'}, {icon:'🧁',noun:'kue mangkuk'},
];
export function parseIconArithmetic(prompt:string) {
  const source=(prompt.trim() === '🍪🍪🍪🍪🍪 diambil 🍪🍪 → sisa?' ? '🍪🍪🍪🍪🍪 - 🍪🍪 = ?' : prompt.trim()).replace(/^(?:Hitunglah|hasil|Hitung hasil dari penjumlahan bola berikut\s*:)\s*/iu,'');
  for(const {icon,noun} of objects) {
    const match=source.match(new RegExp(`^((?:${icon}\\s*)+)([+−-])\\s*((?:${icon}\\s*)+)(?:=\\s*(?:\\?)?|ada berapa ${noun} pada gambar\\s*\\?|adalah\\.{3}|berapa sisa ikannya\\s*\\?)$`,'iu'));
    if(!match)continue;
    const left=[...match[1].matchAll(new RegExp(icon,'gu'))].length;
    const right=[...match[3].matchAll(new RegExp(icon,'gu'))].length;
    const operation=match[2]==='+'?'add' as const:'subtract' as const;
    if(left>20||right>20||(operation==='add'?left+right>20:right>left))return null;
    return {left,right,operation,scene:{title:'Hitung benda pada soal',object:icon,noun,destination:'Benda yang dipindahkan'}};
  }
  return null;
}
