import { parseVisualArithmetic } from './visualArithmetic';
test.each(['7 - 3 = ?', '4 + 6 = ?', '0 − 0 = …'])('supports explicit bounded operation %s', prompt => expect(parseVisualArithmetic(prompt)).not.toBeNull());
test.each(['Ada 7 apel, dimakan 3', '7 - 9 = ?', '20 + 1 = ?', '3 + 4 = 7', '3 + 4 = ? lalu tambah 2'])('preserves unsupported prompt %s', prompt => expect(parseVisualArithmetic(prompt)).toBeNull());
