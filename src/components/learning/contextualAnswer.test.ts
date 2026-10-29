import {contextualAnswer} from './contextualAnswer';
test('equation retains operands and does not compute the answer',()=>expect(contextualAnswer('4 + 5 = ?')).toEqual({kind:'equation',left:4,right:5,operator:'+'}));
test('counting provides a noun without exposing the count',()=>expect(contextualAnswer('🍎🍎🍎 ada berapa?')).toEqual({kind:'quantity',noun:'apel'}));
test('story keeps its object identity',()=>expect(contextualAnswer('Ada 19 kelereng, hilang 4. Sisa?')).toEqual({kind:'quantity',noun:'kelereng'}));
test.each(['Tuliskan contoh benda di kelas','4 + 5 + 6 = ?','Lengkapi angka yang kosong 6 + ... = 10'])('leaves unsupported prompt to existing answer controls: %s',prompt=>expect(contextualAnswer(prompt)).toBeNull());
