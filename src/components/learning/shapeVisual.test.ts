import { parseShapeVisual } from './shapeVisual';
test('retains ordered shapes in mixed live question',()=>expect(parseShapeVisual('Lingkari semua segi empat: ⬛ ⚪ ⬛ 📐 (berapa segi empat?)')).toEqual(['square','circle','square','triangle']));
test.each(['🔺 bentuk apa pada gambar disamping ?','⬛ ini bentuk apa?','⚪ ini bentuk apa?'])('renders single source shape %s',prompt=>expect(parseShapeVisual(prompt)).toHaveLength(1));
test.each(['Bentuk dengan 3 sisi disebut...','Pilih yang segitiga','Lingkari semua segi empat: ⬛ ⚪','Pasangkan bentuk dengan namanya.'])('does not invent missing picture %s',prompt=>expect(parseShapeVisual(prompt)).toBeNull());
