import {parsePlaceValue} from './placeValue';
test.each(['Nilai tempat 14 = ... puluhan + ... satuan','Nilai tempat 19 = ... puluhan + ... satuan','Nilai tempat 12 adalah...','Bilangan 18 terdiri dari...'])('supports explicit bounded quantity %s',prompt=>expect(parsePlaceValue(prompt)).not.toBeNull());
test('keeps twenty as two bundles with no loose sticks',()=>expect(parsePlaceValue('Ada 2 puluhan dan 0 satuan = ?')).toEqual({tens:2,ones:0}));
test('reads tens and units from prompt',()=>expect(parsePlaceValue('Ada 1 puluhan dan 7 satuan, sebutkan angka tersebut...')).toEqual({tens:1,ones:7}));
test.each(['Nilai tempat.','Nilai tempat 99 adalah...','Ada 2 puluhan dan 7 satuan = ?','Bilangan 18 terdiri dari... lalu tambah 1'])('rejects unsupported prompt %s',prompt=>expect(parsePlaceValue(prompt)).toBeNull());
