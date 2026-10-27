import { parseStoryVisual } from './storyVisual';
test('maps explicit live story without reading answer keys',()=>expect(parseStoryVisual('Ada 15 🍎, dimakan 3. Sisa?')).toMatchObject({left:15,right:3,operation:'subtract',scene:{object:'🍎',noun:'apel'}}));
test('three named arrivals correspond to three children',()=>expect(parseStoryVisual('Ada 6 siswa didalam kelas, kemudian datang amin, gatra dan yusuf. berapa siswa yang ada didalam kelas sekarang?')).toMatchObject({left:6,right:3,operation:'add'}));
test.each(['Ada 15 🍎, dimakan 4. Sisa?','Ada 15 apel','Ada 8 🌸 dan 5 🦋. Berapa selisihnya?'])('rejects edited or unrelated story %s',prompt=>expect(parseStoryVisual(prompt)).toBeNull());
