// Bounded polynomial normalization; never executes question or student code.
type Q = { n: bigint; d: bigint };
type Polynomial = Map<string, Q>; // Sorted variable letters, e.g. "aax" = a²x.
const Z = BigInt(0);
const O = BigInt(1);
const MAX_TERMS = 128;
const MAX_DEGREE = 8;

function rational(n: bigint, d = O): Q {
  if (d === Z) throw new Error("zero denominator");
  if (n.toString(2).length > 512 || d.toString(2).length > 512) throw new Error("coefficient limit");
  if (d < Z) { n = -n; d = -d; }
  let a = n < Z ? -n : n;
  let b = d;
  while (b !== Z) { const rest = a % b; a = b; b = rest; }
  const factor = a || O;
  return { n: n / factor, d: d / factor };
}

function add(a: Polynomial, b: Polynomial, sign = O): Polynomial {
  const out = new Map(a);
  for (const [key, value] of b) {
    const previous = out.get(key) || rational(Z);
    const next = rational(previous.n * value.d + sign * value.n * previous.d, previous.d * value.d);
    if (next.n === Z) out.delete(key); else out.set(key, next);
  }
  if (out.size > MAX_TERMS) throw new Error("term limit");
  return out;
}

function multiply(a: Polynomial, b: Polynomial): Polynomial {
  let out: Polynomial = new Map();
  for (const [left, x] of a) for (const [right, y] of b) {
    const key = (left + right).split("").sort().join("");
    if (key.length > MAX_DEGREE) throw new Error("degree limit");
    out = add(out, new Map([[key, rational(x.n * y.n, x.d * y.d)]]));
  }
  return out;
}

function parsePolynomial(source: string): Polynomial | null {
  if (!source.trim() || source.length > 500 || /[A-Za-z]{3,}/.test(source)) return null;
  source = source.replace(/−/g, "-").replace(/×|·/g, "*").replace(/÷/g, "/")
    .replace(/²/g, "^2").replace(/³/g, "^3");
  // Whitespace must not join numbers: "1 2" cannot become 12 or 1*2.
  const tokens = source.match(/\d+(?:[.,]\d+)?|[A-Za-z]|[()+*/^-]/g) || [];
  if (tokens.length > 128 || source.replace(/\s/g, "") !== tokens.join("")) return null;
  const variables = new Set(tokens.filter((token) => /^[A-Za-z]$/.test(token)));
  if (variables.size > 4) return null;
  let index = 0;
  let operations = 0;
  const tick = () => { if (++operations > 1024) throw new Error("operation limit"); };
  const isNumber = (token: string | undefined) => token !== undefined && /^\d/.test(token);
  const startsAtom = (token: string | undefined) => token !== undefined && (/^[A-Za-z]$/.test(token) || token === "(");

  function atom(): Polynomial {
    tick();
    const token = tokens[index++];
    if (token === "(") {
      const result = expression();
      if (tokens[index++] !== ")") throw new Error("missing parenthesis");
      return result;
    }
    if (isNumber(token)) {
      if (token.length > 24) throw new Error("number limit");
      const parts = token.split(/[.,]/);
      const value = rational(BigInt(parts.join("")), BigInt(10) ** BigInt(parts[1]?.length || 0));
      return value.n === Z ? new Map() : new Map([["", value]]);
    }
    if (token && /^[A-Za-z]$/.test(token)) return new Map([[token, rational(O)]]);
    throw new Error("expected atom");
  }

  function power(): Polynomial {
    let value = atom();
    if (tokens[index] === "^") {
      index++;
      const exponent = tokens[index++];
      if (!exponent || !/^[0-8]$/.test(exponent)) throw new Error("unsupported exponent");
      const base = value;
      if (base.size === 0 && exponent === "0") throw new Error("undefined power");
      value = new Map([["", rational(O)]]);
      for (let i = 0; i < Number(exponent); i++) { tick(); value = multiply(value, base); }
    }
    return value;
  }

  function unary(): Polynomial {
    tick();
    if (tokens[index] === "+") { index++; return unary(); }
    if (tokens[index] === "-") { index++; return multiply(new Map([["", rational(-O)]]), unary()); }
    return power();
  }

  function product(): Polynomial {
    let value = unary();
    while (tokens[index] === "*" || tokens[index] === "/" || startsAtom(tokens[index])) {
      tick();
      const operator = tokens[index];
      if (operator === "*" || operator === "/") index++;
      const next = unary();
      if (operator === "/") {
        // Variable denominators would change domains; keep them unsupported.
        const denominator = next.get("");
        if (next.size !== 1 || !denominator || denominator.n === Z) throw new Error("nonconstant divisor");
        value = multiply(value, new Map([["", rational(denominator.d, denominator.n)]]));
      } else value = multiply(value, next);
    }
    return value;
  }

  function expression(): Polynomial {
    let value = product();
    while (tokens[index] === "+" || tokens[index] === "-") {
      const operator = tokens[index++];
      value = add(value, product(), operator === "-" ? -O : O);
    }
    return value;
  }
  try {
    const result = expression();
    return index === tokens.length ? result : null;
  } catch { return null; }
}

function same(a: Polynomial, b: Polynomial): boolean {
  return a.size === b.size && [...a].every(([key, x]) => {
    const y = b.get(key);
    return y !== undefined && x.n === y.n && x.d === y.d;
  });
}

function assignments(source: string): Map<string, string> | null {
  if (source.length > 1000) return null;
  const parts = source.trim().split(/\s*(?:[,;]|\bdan\b)\s*(?=[A-Za-z]\s*=)/);
  if (parts.length > 8) return null;
  const result = new Map<string, string>();
  for (const part of parts) {
    const match = part.match(/^\s*([A-Za-z])\s*=\s*([^=]+?)\s*$/);
    if (!match || result.has(match[1])) return null;
    result.set(match[1], match[2]);
  }
  return result.size ? result : null;
}

// null means the key requires the existing legacy/typed rubric, not this parser.
export function compareAlgebra(
  selected: string,
  correct: string,
  compareScalars: (actual: string, expected: string) => boolean | null,
): boolean | null {
  const expectedAssignments = assignments(correct);
  if (expectedAssignments) {
    // Only claim supported assignment keys when every RHS is scalar/polynomial.
    if ([...expectedAssignments.values()].some((value) => compareScalars(value, value) === null && parsePolynomial(value) === null)) return null;
    const actualAssignments = assignments(selected);
    if (!actualAssignments || actualAssignments.size !== expectedAssignments.size) return false;
    return [...expectedAssignments].every(([variable, value]) => {
      const actual = actualAssignments.get(variable);
      if (actual === undefined) return false;
      const scalar = compareScalars(actual, value);
      if (scalar !== null) return scalar;
      const expectedPoly = parsePolynomial(value);
      const actualPoly = parsePolynomial(actual);
      return expectedPoly !== null && actualPoly !== null && same(expectedPoly, actualPoly);
    });
  }
  // A prose key is not an algebra expression merely because it contains letters.
  if (!/[A-Za-z]/.test(correct) || !(/[+*/^()²³-]/.test(correct) || /\d\s*[A-Za-z]/.test(correct) || /^[A-Za-z]$/.test(correct.trim()))) return null;
  const expected = parsePolynomial(correct);
  if (expected === null) return null;
  const actual = parsePolynomial(selected);
  return actual !== null && same(actual, expected);
}
