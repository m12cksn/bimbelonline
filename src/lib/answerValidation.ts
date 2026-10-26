type Fraction = { numerator: number; denominator: number; label: string };
type Rational = { numerator: bigint; denominator: bigint; unit: string };
const ZERO = BigInt(0);
const ONE = BigInt(1);

function replaceLatexFractions(value: string) {
  return value.replace(/\\frac\s*\{\s*(-?\d+)\s*\}\s*\{\s*(-?\d+)\s*\}/g, "$1/$2");
}

// Parse the entire scalar. Never extract one matching number from an answer.
function parseScalar(raw: string): Rational | null {
  if (raw.length > 256) return null;
  let value = replaceLatexFractions(replaceUnicodeFractions(raw)).trim()
    .replace(/−/g, "-").replace(/°|derajat/gi, "deg");
  let unit = "";
  if (/^rp\s*/i.test(value)) { unit = "rp"; value = value.replace(/^rp\s*/i, ""); }
  const suffix = value.match(/\s*(%|deg|mm[²³23]?|cm[²³23]?|km[²³23]?|m[²³23]?|kg|g|ml|liter|l|jam|menit|detik|ms)$/i);
  let percent = false;
  if (suffix) {
    if (unit) return null;
    percent = suffix[1] === "%";
    unit = percent ? "" : suffix[1].toLowerCase().replace(/²/g, "2").replace(/³/g, "3");
    value = value.slice(0, suffix.index).trim();
  }
  const mixed = value.match(/^([+-]?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  const fraction = value.match(/^([+-]?\d+)\s*\/\s*([+-]?\d+)$/);
  let numerator: bigint;
  let denominator: bigint;
  if (mixed) {
    if (mixed.slice(1).some((part) => part.length > 32)) return null;
    denominator = BigInt(mixed[3]);
    const part = BigInt(mixed[2]);
    if (denominator === ZERO || part >= denominator) return null;
    numerator = BigInt(mixed[1]) * denominator + (mixed[1].startsWith("-") ? -part : part);
  } else if (fraction) {
    if (fraction.slice(1).some((part) => part.length > 32)) return null;
    numerator = BigInt(fraction[1]); denominator = BigInt(fraction[2]);
    if (denominator === ZERO) return null;
  } else {
    const sign = value.startsWith("-") ? -ONE : ONE;
    value = value.replace(/^[+-]/, "");
    if (!/^\d+(?:[.,]\d+)*$/.test(value)) return null;
    const dots = (value.match(/\./g) || []).length;
    const commas = (value.match(/,/g) || []).length;
    let integer: string;
    let decimal = "";
    if (dots && commas) {
      const separator = value.lastIndexOf(".") > value.lastIndexOf(",") ? "." : ",";
      const grouping = separator === "." ? "," : ".";
      const parts = value.split(separator);
      if (parts.length !== 2 || !parts[1] || parts[1].includes(grouping)) return null;
      const groups = parts[0].split(grouping);
      if (!/^\d{1,3}$/.test(groups[0]) || groups.length < 2 || groups.slice(1).some((part) => !/^\d{3}$/.test(part))) return null;
      integer = groups.join(""); decimal = parts[1];
    } else if (dots || commas) {
      const parts = value.split(dots ? "." : ",");
      // Preserve the existing legacy thousands convention for 10.000 / 10,000.
      const grouped = /^[1-9]\d{0,2}$/.test(parts[0]) && parts.slice(1).every((part) => /^\d{3}$/.test(part));
      if (grouped) integer = parts.join("");
      else if (parts.length === 2) { integer = parts[0]; decimal = parts[1]; }
      else return null;
    } else integer = value;
    if (integer.length + decimal.length > 32) return null;
    numerator = sign * BigInt(integer + decimal);
    denominator = BigInt(10) ** BigInt(decimal.length);
  }
  if (denominator < ZERO) { numerator = -numerator; denominator = -denominator; }
  if (percent) denominator *= BigInt(100);
  return { numerator, denominator, unit };
}

export function normalizeFraction(value: string): Fraction | null {
  const normalized = replaceLatexFractions(replaceUnicodeFractions(value)).trim();
  if (!/^[+-]?\d+\s*\/\s*[+-]?\d+$/.test(normalized)) return null;
  const parsed = parseScalar(normalized);
  if (!parsed) return null;
  let a = parsed.numerator < ZERO ? -parsed.numerator : parsed.numerator;
  let b = parsed.denominator;
  while (b !== ZERO) { const rest = a % b; a = b; b = rest; }
  const factor = a || ONE;
  const numerator = Number(parsed.numerator / factor);
  const denominator = Number(parsed.denominator / factor);
  if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator)) return null;
  return { numerator, denominator, label: `${numerator}/${denominator}` };
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/derajat/g, "deg")
    .replace(/°/g, "deg")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeSymbolAnswer(value: string) {
  return value
    .replace(/\s+/g, "")
    .replace(/≤/g, "<=")
    .replace(/≥/g, ">=");
}

function replaceUnicodeFractions(value: string) {
  if (value.includes("⁄")) {
    const digits: Record<string, string> = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9" };
    value = value.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉]/g, (digit) => digits[digit]).replace(/⁄/g, "/");
  }
  const map: Record<string, string> = {
    "½": "1/2",
    "¼": "1/4",
    "¾": "3/4",
    "⅓": "1/3",
    "⅔": "2/3",
    "⅕": "1/5",
    "⅖": "2/5",
    "⅗": "3/5",
    "⅘": "4/5",
    "⅙": "1/6",
    "⅚": "5/6",
    "⅛": "1/8",
    "⅜": "3/8",
    "⅝": "5/8",
    "⅞": "7/8",
  };

  return value.replace(
    /[½¼¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g,
    (char, offset: number, source: string) =>
      `${offset > 0 && /\d/.test(source[offset - 1]) ? " " : ""}${map[char] ?? char}`
  );
}

function getTextTokens(value: string) {
  const stopwords = new Set(["dan", "atau", "yang", "di", "ke", "dari", "pada"]);
  return normalizeText(value)
    .split(" ")
    .filter(Boolean)
    .filter((token) => !stopwords.has(token));
}

function extractAltGroups(value: string) {
  const groups: string[][] = [];
  const pattern = /([a-zA-Z]+)\s*\/\s*([a-zA-Z]+)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(value)) !== null) {
    groups.push([match[1].toLowerCase(), match[2].toLowerCase()]);
  }
  return groups;
}

export function isInputAnswerCorrect(selected: string, correct: string | null): boolean {
  if (typeof selected !== "string" || typeof correct !== "string" ||
      !selected.trim() || !correct.trim() || selected.length > 3000 || correct.length > 3000) return false;
  const normalizedSelected = replaceLatexFractions(replaceUnicodeFractions(selected)).trim();
  const normalizedCorrect = replaceLatexFractions(replaceUnicodeFractions(correct)).trim();
  if (/^(?:nan|[+-]?infinity)$/i.test(normalizedCorrect)) return false;
  const expected = parseScalar(normalizedCorrect);
  if (expected) {
    const actual = parseScalar(normalizedSelected);
    if (!actual) return false;
    // Legacy inputs may omit a unit from a unit-bearing key, but cannot invent or change one.
    if (actual.unit && actual.unit !== expected.unit) return false;
    return actual.numerator * expected.denominator === expected.numerator * actual.denominator;
  }

  // Legacy equation keys may contain working. Only a plain numeric RHS is a scalar key.
  // Restrict the LHS to arithmetic characters: structured/algebraic keys remain exact-match.
  const equation = normalizedCorrect.match(/^([\d\s+*/().,−×÷-]+)=([^=]+)$/);
  if (equation && parseScalar(equation[2])) {
    return normalizeSymbolAnswer(normalizedSelected) === normalizeSymbolAnswer(normalizedCorrect) ||
      isInputAnswerCorrect(normalizedSelected, equation[2]);
  }

  // A legacy comma-separated list is not a scalar; require its whole representation.
  if (/^[+-]?\d+(?:\s*,\s*[+-]?\d+){2,}$/.test(normalizedCorrect)) {
    return normalizeSymbolAnswer(normalizedSelected) === normalizeSymbolAnswer(normalizedCorrect);
  }
  // Malformed single scalars (including zero denominators) are never valid keys.
  if (/^[+-]?\d+(?:[.,]\d+)*%?$/.test(normalizedCorrect) ||
      /^[+-]?\d+\s*\/\s*[+-]?\d+%?$/.test(normalizedCorrect)) return false;

  // Lists, expressions, ratios, algebra and numeric prose must never use token overlap.
  // Until typed rubrics exist, require the complete legacy key, preserving math signs.
  if (/\d|[<>=%+*^:≤≥−²³⊥∥√π∞]/.test(normalizedCorrect)) {
    return normalizeSymbolAnswer(normalizedSelected).toLowerCase() ===
      normalizeSymbolAnswer(normalizedCorrect).toLowerCase();
  }
  // Pure text supports legacy slash alternatives, but rejects contradictory extra words.
  const selectedTokens = getTextTokens(normalizedSelected);
  const correctTokens = getTextTokens(normalizedCorrect);
  if (!selectedTokens.length || !correctTokens.length) return false;
  const altGroups = extractAltGroups(normalizedCorrect);
  const altTokens = new Set(altGroups.flat());
  const requiredTokens = correctTokens.filter((token) => !altTokens.has(token));
  const selectedSet = new Set(selectedTokens);
  const allowed = new Set(correctTokens);
  return selectedTokens.every((token) => allowed.has(token)) &&
    requiredTokens.every((token) => selectedSet.has(token)) &&
    altGroups.every((group) => group.some((token) => selectedSet.has(token)));
}
