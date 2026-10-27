import { parseVisualArithmetic } from './visualArithmetic';
test.each(['7 - 3 = ?', '4 + 6 = ?', '0 − 0 = …'])('supports explicit bounded operation %s', prompt => expect(parseVisualArithmetic(prompt)).not.toBeNull());
test.each(['Ada 7 apel, dimakan 3', '7 - 9 = ?', '20 + 1 = ?', '3 + 4 = 7', '3 + 4 = ? lalu tambah 2'])('preserves unsupported prompt %s', prompt => expect(parseVisualArithmetic(prompt)).toBeNull());

test.each(['Hitunglah 3 + 4 = ?', 'Hitunglah : 8 - 2 = ?', 'Hitunglah penjumlahan berikut 0 + 6 = ?', 'Lengkapi: 10 + 4 = ?', 'Jumlah 6 + 8 = ?'])('supports reviewed prefix %s', prompt => expect(parseVisualArithmetic(prompt)).not.toBeNull());
test.each(['Hitunglah penjumlahan berikut 1 + 2 + 3 = ?', 'Jika 4 + 3 = 7, maka 7 - 4 = ?', 'Lengkapi angka yang kosong 6 + .... = 10'])('rejects ambiguous operation %s', prompt => expect(parseVisualArithmetic(prompt)).toBeNull());
test('accepts empty RHS in a complete multipart operation',()=>expect(parseVisualArithmetic('8 - 3 =')).toEqual({left:8,right:3,operation:'subtract'}));
test('does not accept missing left operand',()=>expect(parseVisualArithmetic(' + 3 =')).toBeNull());
