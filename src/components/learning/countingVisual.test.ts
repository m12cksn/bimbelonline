import { parseCountingVisual } from './countingVisual';
test('recognizes reviewed live apple question', () => expect(parseCountingVisual('🍎🍎🍎🍎🍎 pada gambar disamping terdapat berapa apel ?')).toEqual({icon:'🍎',name:'apel',count:5}));
test('counts emoji objects without UTF16 mistakes', () => expect(parseCountingVisual('🐟🐟🐟 ada berapa?')?.count).toBe(3));
test.each(['🍎🍎 + 🍎 = ?', '🐟🐟 - 🐟 berapa sisa ikannya ?', '🍎🐟 ada berapa?', '🍎 ada berapa? lalu tambah 3', 'Ada 5 apel', '🍎'.repeat(21)+' ada berapa?'])('leaves unsupported counting prompt unchanged %s', prompt => expect(parseCountingVisual(prompt)).toBeNull());
