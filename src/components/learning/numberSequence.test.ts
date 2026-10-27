import { parseNumberSequence } from './numberSequence';
test.each(['Lengkapi angka yang kosong : 1,2,3, . .,5','Hitung mundur: 20, 19, __, 17','Lengkapi: 11, 13, 15, ...., 19'])('recognizes reviewed list %s', prompt => expect(parseNumberSequence(prompt)).not.toBeNull());
test('retains blank instead of computing answer', () => expect(parseNumberSequence('Lengkapi: 1,2,...,4')).toEqual([1,2,null,4]));
test.each(['Urutkan: 3,2,1','Lengkapi: 1,...,...,4','Lengkapi: 1,2,3','Lengkapi: 1,2,?,4','Lengkapi: 1,2,...,99','Lengkapi: 1,2,...,4 lalu tambah 2'])('preserves unsupported list %s', prompt => expect(parseNumberSequence(prompt)).toBeNull());
test('before prompt keeps unknown on left',()=>expect(parseNumberSequence('Bilangan sebelum 20 adalah...')).toEqual([null,20]));
test('after prompt keeps unknown on right',()=>expect(parseNumberSequence('Angka setelah 6 adalah...')).toEqual([6,null]));
test.each(['Angka setelah 20 adalah...','Bilangan sebelum 0 adalah...','Bilangan sebelum 6 adalah... lalu tambah 2'])('rejects unsupported neighbor %s',prompt=>expect(parseNumberSequence(prompt)).toBeNull());
