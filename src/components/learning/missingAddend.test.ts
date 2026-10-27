import {parseMissingAddend} from './missingAddend';
test('retains missing right operand without solving',()=>expect(parseMissingAddend('Lengkapi angka yang kosong 6 + .... = 10')).toEqual({left:6,right:null,total:10}));
test('retains missing left operand',()=>expect(parseMissingAddend('Lengkapi angka yang kosong ... + 2 = 10')).toEqual({left:null,right:2,total:10}));
test.each(['Lengkapi angka yang kosong ... + ... = 10','Lengkapi angka yang kosong 12 + ... = 10','Lengkapi angka yang kosong 7 + ... = 21','Lengkapi angka yang kosong 7 - ... = 10','Lengkapi angka yang kosong 7 + ... = 10 lalu tambah 2'])('rejects unsupported configuration %s',prompt=>expect(parseMissingAddend(prompt)).toBeNull());
