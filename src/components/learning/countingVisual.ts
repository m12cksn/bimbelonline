const objects = [{ icon: '🍎', name: 'apel' }, { icon: '🐟', name: 'ikan' }, { icon: '⭐', name: 'bintang' }, { icon: '⚽', name: 'bola' }, { icon: '🎈', name: 'balon' }, { icon: '🐱', name: 'kucing' }, { icon: '🍪', name: 'kue' }];
export function parseCountingVisual(prompt: string) {
  for (const object of objects) {
    const match = prompt.trim().match(new RegExp(`^(?:Hitung(?:lah)?\\s*:?\\s*)?((?:${object.icon}\\s*)+)(?:ada berapa\\??|pada gambar disamping terdapat berapa ${object.name}\\s*\\?)$`, 'iu'));
    if (!match) continue;
    const count = Array.from(match[1].matchAll(new RegExp(object.icon, 'gu'))).length;
    if (count >= 1 && count <= 20) return { ...object, count };
  }
  return null;
}
