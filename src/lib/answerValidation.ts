type Fraction = {
  numerator: number;
  denominator: number;
  label: string;
};

export function normalizeFraction(value: string): Fraction | null {
  const match = value.match(/(-?\d+)\s*\/\s*(-?\d+)/);
  if (!match) return null;
  const numerator = Number(match[1]);
  const denominator = Number(match[2]);
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return null;
  }
  const gcd = (a: number, b: number): number => {
    if (b === 0) return Math.abs(a);
    return gcd(b, a % b);
  };
  const factor = gcd(numerator, denominator) || 1;
  const simplifiedNum = numerator / factor;
  const simplifiedDen = denominator / factor;
  const sign = simplifiedDen < 0 ? -1 : 1;
  return {
    numerator: simplifiedNum * sign,
    denominator: Math.abs(simplifiedDen),
    label: `${simplifiedNum * sign}/${Math.abs(simplifiedDen)}`,
  };
}

function extractFractions(answer: string) {
  const matches = answer.match(/-?\d+\s*\/\s*-?\d+/g) ?? [];
  return matches
    .map((chunk) => normalizeFraction(chunk))
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

function normalizeNumberToken(raw: string) {
  let value = raw.trim();
  const hasDot = value.includes(".");
  const hasComma = value.includes(",");

  if (hasDot && hasComma) {
    const lastDot = value.lastIndexOf(".");
    const lastComma = value.lastIndexOf(",");
    if (lastDot > lastComma) {
      value = value.replace(/,/g, "");
    } else {
      value = value.replace(/\./g, "").replace(",", ".");
    }
    return value;
  }

  if (hasDot) {
    const parts = value.split(".");
    if (parts.length === 2) {
      const decimalPart = parts[1];
      if (decimalPart.length === 3 && !value.startsWith("0.")) {
        value = value.replace(/\./g, "");
        return value;
      }
      return value;
    }
    if (/^\d{1,3}(\.\d{3})+$/.test(value)) {
      return value.replace(/\./g, "");
    }
  }

  if (hasComma) {
    const parts = value.split(",");
    if (parts.length === 2) {
      const decimalPart = parts[1];
      if (decimalPart.length === 3 && !value.startsWith("0,")) {
        return value.replace(/,/g, "");
      }
      return value.replace(",", ".");
    }
    if (/^\d{1,3}(,\d{3})+$/.test(value)) {
      return value.replace(/,/g, "");
    }
  }

  return value;
}

function extractNumbers(answer: string) {
  const matches = answer.match(/-?\d+(?:[.,]\d+)?/g) ?? [];
  return matches.map((chunk) => normalizeNumberToken(chunk));
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
    (char) => map[char] ?? char
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

export function isInputAnswerCorrect(selected: string, correct: string | null) {
  if (!correct) return false;
  const normalizedSelected = replaceUnicodeFractions(selected);
  const normalizedCorrect = replaceUnicodeFractions(correct);
  const symbolCorrect = normalizeSymbolAnswer(normalizedCorrect);
  const symbolSelected = normalizeSymbolAnswer(normalizedSelected);
  if (/[<>]=?/.test(symbolCorrect)) {
    return symbolCorrect === symbolSelected;
  }
  const correctFraction = normalizeFraction(normalizedCorrect);
  if (correctFraction) {
    const fractions = extractFractions(normalizedSelected);
    if (fractions.some((item) => item.label === correctFraction.label)) {
      return true;
    }
    const correctDecimal =
      correctFraction.numerator / correctFraction.denominator;
    const selectedNumbers = extractNumbers(normalizedSelected);
    return selectedNumbers.some(
      (value) => Math.abs(Number(value) - correctDecimal) < 1e-9
    );
  }

  const correctNumbers = extractNumbers(normalizedCorrect).map((item) =>
    item.trim()
  );
  const answerNumbers = extractNumbers(normalizedSelected).map((item) =>
    item.trim()
  );

  if (correctNumbers.length > 0) {
    const expected = correctNumbers[correctNumbers.length - 1];
    if (answerNumbers.some((value) => value === expected)) {
      return true;
    }
    if (answerNumbers.some((value) => correctNumbers.includes(value))) {
      return true;
    }
    const selectedFractions = extractFractions(normalizedSelected);
    if (selectedFractions.length > 0) {
      const selectedDecimals = selectedFractions.map(
        (item) => item.numerator / item.denominator
      );
      if (
        selectedDecimals.some((value) =>
          correctNumbers.some(
            (num) => Math.abs(Number(num) - value) < 1e-9
          )
        )
      ) {
        return true;
      }
    }
  }

  const selectedTokens = new Set(getTextTokens(normalizedSelected));
  const correctTokens = getTextTokens(normalizedCorrect);
  if (!selectedTokens.size || correctTokens.length === 0) return false;

  const altGroups = extractAltGroups(normalizedCorrect);
  const altTokens = new Set(altGroups.flat());
  const requiredTokens = correctTokens.filter((token) => !altTokens.has(token));

  const hasRequired = requiredTokens.every((token) => selectedTokens.has(token));
  if (!hasRequired) return false;

  if (altGroups.length === 0) {
    return true;
  }

  return altGroups.every((group) =>
    group.some((token) => selectedTokens.has(token))
  );
}
