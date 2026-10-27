type Story = { left: number; right: number; operation: 'add' | 'subtract'; scene: { title: string; object: string; noun: string; destination: string } };
const story = (left:number,right:number,operation:Story['operation'],object:string,noun:string,destination:string):Story => ({left,right,operation,scene:{title:'Cerita bergambar',object,noun,destination}});
const stories: Record<string,Story> = {
  'Amin memiliki sepuluh pensil, 3 pensil hilang. Berapakah sisa pensil amin ?': story(10,3,'subtract','✏️','pensil','Pensil yang hilang'),
  'Ada 4 burung di tiang listrik, kemudian datang lagi 2 burung. berapa jumlah burung sekarang ?': story(4,2,'add','🐦','burung','Burung yang datang'),
  'Ada 6 siswa didalam kelas, kemudian datang amin, gatra dan yusuf. berapa siswa yang ada didalam kelas sekarang?': story(6,3,'add','🧒','anak','Anak yang datang'),
  'Ada 6 anak di taman, 2 anak pulang untuk makan siang. berapa anak yang ada di taman sekarang ?': story(6,2,'subtract','🧒','anak','Anak yang pulang'),
  'Ada 10 ⚽ dan 3 ⚽ lagi bola tambahan. sekarang ada berapa jumlah bola ?': story(10,3,'add','⚽','bola','Bola tambahan'),
  'Dika memiliki 7 🍩 kemudian ayahnya memberikan lagi 6 🍩. Berapa jumlah 🍩 dika sekarang ?': story(7,6,'add','🍩','donat','Donat tambahan'),
  'Ada 15 🍎, dimakan 3. Sisa?': story(15,3,'subtract','🍎','apel','Apel yang dimakan'),
  'Ada 10 pensil, ditambah 7. Jumlah?': story(10,7,'add','✏️','pensil','Pensil tambahan'),
  'Ada 19 kelereng, hilang 4. Sisa?': story(19,4,'subtract','🔵','kelereng','Kelereng yang hilang'),
  'Ada 5 anak. Datang 9 anak. Jumlah?': story(5,9,'add','🧒','anak','Anak yang datang'),
};
export function parseStoryVisual(prompt:string):Story|null { return stories[prompt.trim()] ?? null; }
