import {parseIconArithmetic} from './iconArithmetic';
test('counts graphemes instead of UTF16 units',()=>expect(parseIconArithmetic('Hitunglah 🍎🍎 + 🍎 = ?')).toMatchObject({left:2,right:1,operation:'add',scene:{object:'🍎'}}));
test.each(['Hitung hasil dari penjumlahan bola berikut : ⚽⚽⚽ + ⚽ = ?','🐟🐟🐟🐟 - 🐟 berapa sisa ikannya ?','⚽⚽⚽⚽+⚽⚽ ada berapa bola pada gambar ?','hasil 🎈🎈 + 🎈🎈 adalah...','🐱🐱🐱🐱🐱 + 🐱🐱 = ?','Hitunglah 🐟🐟🐟 + 🐟🐟 = ?','Hitunglah 🍪🍪🍪🍪 + 🍪 = ?'])('supports reviewed prompt %s',prompt=>expect(parseIconArithmetic(prompt)).not.toBeNull());
test.each(['🍎 + 🐟 = ?','🍎 - 🍎🍎 = ?','🍎 + 🍎 = ? lalu tambah 3','🍎 + 🍎 + 🍎 = ?','🍎'.repeat(20)+' + 🍎 = ?'])('rejects unsupported expression %s',prompt=>expect(parseIconArithmetic(prompt)).toBeNull());
test('supports multipart bananas with blank RHS',()=>expect(parseIconArithmetic('🍌🍌 + 🍌 =')).toMatchObject({left:2,right:1,operation:'add',scene:{object:'🍌'}}));
test('supports multipart stars',()=>expect(parseIconArithmetic('⭐⭐⭐ - ⭐ =')).toMatchObject({left:3,right:1,operation:'subtract'}));

test('keeps cupcake identity and counts',()=>expect(parseIconArithmetic('Hitunglah 🧁🧁🧁🧁🧁 - 🧁🧁🧁 =')).toMatchObject({left:5,right:3,operation:'subtract',scene:{object:'🧁'}}));
test('supports reviewed cookie story without solving',()=>expect(parseIconArithmetic('🍪🍪🍪🍪🍪 diambil 🍪🍪 → sisa?')).toMatchObject({left:5,right:2,operation:'subtract'}));
test('does not infer edited cookie stories',()=>expect(parseIconArithmetic('🍪🍪🍪🍪🍪 diambil 🍪🍪 lalu ditambah 2')).toBeNull());
