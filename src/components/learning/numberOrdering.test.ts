import {parseNumberOrdering,selectedOrderingValues} from './numberOrdering';
import {isInputAnswerCorrect} from '@/lib/answerValidation';
test('retains original card order and requested direction',()=>expect(parseNumberOrdering('Urutkan dari besar ke kecil: 20, 14, 16')).toEqual({values:[20,14,16],direction:'besar ke kecil'}));
test.each(['Urutan naik yang benar?','Urutkan dari kecil ke besar: 1,1,2','Urutkan dari kecil ke besar: 21,2,3','Urutkan dari kecil ke besar: 3,2,1 lalu tambah 2'])('does not infer unavailable cards %s',prompt=>expect(parseNumberOrdering(prompt)).toBeNull());
test('accepts selected source cards only',()=>{expect(selectedOrderingValues('13, 11',[13,18,11])).toEqual([13,11]);expect(selectedOrderingValues('13,13',[13,18,11])).toEqual([]);expect(selectedOrderingValues('13,99',[13,18,11])).toEqual([]);});
test('card output is compatible with existing list grading and wrong order rejected',()=>{expect(isInputAnswerCorrect('11, 13, 18','11,13,18')).toBe(true);expect(isInputAnswerCorrect('13, 11, 18','11,13,18')).toBe(false);});
