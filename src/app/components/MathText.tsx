"use client";

import React from "react";

type MathTextProps = {
  text?: string | null;
  className?: string;
};

type VisualIconType =
  | "circle"
  | "circleGreen"
  | "circlePink"
  | "circlePurple"
  | "triangle"
  | "star"
  | "apple"
  | "banana"
  | "cat"
  | "fish"
  | "orange"
  | "block"
  | "box"
  | "plus";

type IconToken =
  | {
      kind: "builtIn";
      type: VisualIconType;
      count: number;
      end: number;
    }
  | {
      kind: "asset";
      name: string;
      src: string;
      count: number;
      end: number;
    };

const visualIconAliases: Record<string, VisualIconType> = {
  circle: "circle",
  lingkaran: "circle",
  "circle-green": "circleGreen",
  "lingkaran-hijau": "circleGreen",
  "circle-pink": "circlePink",
  "lingkaran-pink": "circlePink",
  "circle-purple": "circlePurple",
  "lingkaran-ungu": "circlePurple",
  triangle: "triangle",
  segitiga: "triangle",
  star: "star",
  bintang: "star",
  apple: "apple",
  apel: "apple",
  banana: "banana",
  pisang: "banana",
  cat: "cat",
  kucing: "cat",
  fish: "fish",
  ikan: "fish",
  orange: "orange",
  jeruk: "orange",
  oranges: "orange",
  block: "block",
  blok: "block",
  box: "box",
  kotak: "box",
  plus: "plus",
  tambah: "plus",
};

function readBraced(input: string, start: number) {
  if (input[start] !== "{") return null;
  let depth = 0;
  for (let i = start; i < input.length; i += 1) {
    if (input[i] === "{") depth += 1;
    if (input[i] === "}") depth -= 1;
    if (depth === 0) {
      return {
        value: input.slice(start + 1, i),
        end: i + 1,
      };
    }
  }
  return null;
}

function readIconToken(input: string, start: number) {
  if (!input.startsWith("{{", start)) return null;
  const end = input.indexOf("}}", start + 2);
  if (end === -1) return null;

  const raw = input.slice(start + 2, end).trim();
  const parts = raw.split(":").map((part) => part.trim());
  const rawType = parts[0]?.toLowerCase() ?? "";

  if (rawType === "icon") {
    const rawName = parts[1] ?? "";
    const rawCount = parts[2] ?? "";
    const count = Number(rawCount);
    const safeName = rawName.replace(/[\\/?#<>:"|{}^`]/g, "").trim();

    if (!safeName || !Number.isInteger(count) || count < 1) return null;

    const hasExtension = /\.(svg|png|jpg|jpeg|webp)$/i.test(safeName);
    const fileName = hasExtension ? safeName : `${safeName}.webp`;

    return {
      kind: "asset",
      name: safeName.replace(/\.(svg|png|jpg|jpeg|webp)$/i, ""),
      src: `/images/icons/${encodeURIComponent(fileName)}`,
      count: Math.min(count, 40),
      end: end + 2,
    } satisfies IconToken;
  }

  const rawCount = parts[1]?.toLowerCase();
  const iconType = visualIconAliases[rawType];
  const count = Number(rawCount);

  if (!iconType || !Number.isInteger(count) || count < 1) return null;

  return {
    kind: "builtIn",
    type: iconType,
    count: Math.min(count, 40),
    end: end + 2,
  } satisfies IconToken;
}

function readWrapped(input: string, start: number, open: string, close: string) {
  if (input[start] !== open) return null;
  let depth = 0;
  for (let i = start; i < input.length; i += 1) {
    if (input[i] === open) depth += 1;
    if (input[i] === close) depth -= 1;
    if (depth === 0) {
      return {
        value: input.slice(start + 1, i),
        end: i + 1,
      };
    }
  }
  return null;
}

function renderSqrt(
  value: string,
  depth: number,
  key: string,
): React.ReactNode {
  return (
    <span
      key={key}
      className="mx-0.5 inline-flex items-start align-middle leading-none"
    >
      <span className="pr-0.5 text-[1.08em] leading-none">√</span>
      <span className="border-t border-current px-1 pt-0.5">
        {renderInlineMath(value, depth + 1, `${key}-sqrt`)}
      </span>
    </span>
  );
}

function VisualIcon({ type }: { type: VisualIconType }) {
  const common =
    "h-5 w-5 drop-shadow-[0_2px_3px_rgba(15,23,42,0.18)] sm:h-6 sm:w-6";

  if (type === "circle") {
    return (
      <svg viewBox="0 0 32 32" className={common} aria-label="lingkaran">
        <circle cx="16" cy="16" r="12" fill="#38bdf8" />
        <circle cx="12" cy="11" r="4" fill="#bae6fd" opacity="0.95" />
        <circle cx="16" cy="16" r="12" fill="none" stroke="#0284c7" strokeWidth="1.5" />
      </svg>
    );
  }

  if (type === "circleGreen") {
    return (
      <svg viewBox="0 0 32 32" className={common} aria-label="lingkaran hijau">
        <circle cx="16" cy="16" r="12" fill="#4ade80" />
        <circle cx="12" cy="11" r="4" fill="#dcfce7" opacity="0.95" />
        <circle cx="16" cy="16" r="12" fill="none" stroke="#16a34a" strokeWidth="1.5" />
      </svg>
    );
  }

  if (type === "circlePink") {
    return (
      <svg viewBox="0 0 32 32" className={common} aria-label="lingkaran pink">
        <circle cx="16" cy="16" r="12" fill="#f472b6" />
        <circle cx="12" cy="11" r="4" fill="#fce7f3" opacity="0.95" />
        <circle cx="16" cy="16" r="12" fill="none" stroke="#db2777" strokeWidth="1.5" />
      </svg>
    );
  }

  if (type === "circlePurple") {
    return (
      <svg viewBox="0 0 32 32" className={common} aria-label="lingkaran ungu">
        <circle cx="16" cy="16" r="12" fill="#a78bfa" />
        <circle cx="12" cy="11" r="4" fill="#ede9fe" opacity="0.95" />
        <circle cx="16" cy="16" r="12" fill="none" stroke="#7c3aed" strokeWidth="1.5" />
      </svg>
    );
  }

  if (type === "triangle") {
    return (
      <svg viewBox="0 0 32 32" className={common} aria-label="segitiga">
        <path d="M16 4 29 27H3Z" fill="#fb923c" />
        <path d="M16 8 9 22h14Z" fill="#fed7aa" opacity="0.45" />
        <path d="M16 4 29 27H3Z" fill="none" stroke="#ea580c" strokeWidth="1.5" />
      </svg>
    );
  }

  if (type === "star") {
    return (
      <svg viewBox="0 0 32 32" className={common} aria-label="bintang">
        <path
          d="m16 3 3.9 8 8.8 1.3-6.4 6.2 1.5 8.7L16 23.1l-7.8 4.1 1.5-8.7-6.4-6.2 8.8-1.3Z"
          fill="#facc15"
          stroke="#ca8a04"
          strokeWidth="1.4"
        />
        <path d="m16 7 1.8 4-4.2 1.1Z" fill="#fef3c7" opacity="0.85" />
      </svg>
    );
  }

  if (type === "apple") {
    return (
      <svg viewBox="0 0 32 32" className={common} aria-label="apel">
        <path d="M18 8c2.7-3.5 6.3-3 7-2.7-.4 2.8-2.9 5-6.3 5.1Z" fill="#22c55e" />
        <path d="M16.2 10.4c5.4-4.2 12.4-.1 10.6 8.1-1.6 7.5-6.2 9.7-9.7 7.2-3.5 2.5-8.1.3-9.7-7.2-1.8-8.2 5.2-12.3 8.8-8.1Z" fill="#ef4444" />
        <path d="M12 13.2c-1.7 1.5-2.1 4.4-.8 7.8" fill="none" stroke="#fecaca" strokeWidth="2" strokeLinecap="round" />
        <path d="M16.5 10.2c.2-2.8-.8-4.1-2.7-5.4" stroke="#854d0e" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "banana") {
    return (
      <svg viewBox="0 0 32 32" className={common} aria-label="pisang">
        <path
          d="M7 18.5C13.5 27 25 22.5 27 10.5c-4.2 7.4-12.6 9.4-18.4 4.9-.7-.5-1.7.2-1.6 1.1.1.7.4 1.4 0 2Z"
          fill="#facc15"
          stroke="#ca8a04"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M9 17.8c4 3.8 10.9 3.3 15.1-2" fill="none" stroke="#fef3c7" strokeWidth="2" strokeLinecap="round" />
        <path d="M26.5 9.5 29 8.6M6.8 18.2 4.5 20" stroke="#854d0e" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "cat") {
    return (
      <svg viewBox="0 0 32 32" className={common} aria-label="kucing">
        <path d="M8 13 7 5l6 4h6l6-4-1 8c1.6 1.6 2.5 3.7 2.5 6 0 5-4.3 8.5-10.5 8.5S5.5 24 5.5 19c0-2.3.9-4.4 2.5-6Z" fill="#fbbf24" stroke="#b45309" strokeWidth="1.4" strokeLinejoin="round" />
        <circle cx="12" cy="18" r="1.4" fill="#111827" />
        <circle cx="20" cy="18" r="1.4" fill="#111827" />
        <path d="M16 19.5v2M12 23c1.6 1 6.4 1 8 0M10 21H5M22 21h5M10.5 23.5H6M21.5 23.5H26" stroke="#7c2d12" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M11 10.5 8.8 8.8M21 10.5l2.2-1.7" stroke="#fde68a" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "fish") {
    return (
      <svg viewBox="0 0 32 32" className={common} aria-label="ikan">
        <path d="M4 16c4.2-5.2 11.2-6.3 17-1.6L27 10v12l-6-4.4C15.2 22.3 8.2 21.2 4 16Z" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.4" strokeLinejoin="round" />
        <circle cx="11" cy="15" r="1.4" fill="#0f172a" />
        <path d="M15 11.7c1.8.8 3 2.2 3.8 4.3-1 2-2.3 3.4-4.1 4.1" fill="none" stroke="#bae6fd" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M25.8 12.2 22.6 16l3.2 3.8" fill="none" stroke="#075985" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "orange") {
    return (
      <svg viewBox="0 0 32 32" className={common} aria-label="jeruk">
        <circle cx="16" cy="17" r="10.5" fill="#fb923c" stroke="#ea580c" strokeWidth="1.5" />
        <path d="M16 7.2c1.1-2.5 3.7-3.3 6.2-2.5-.4 2.8-2.6 4.6-5.5 4.6Z" fill="#22c55e" stroke="#15803d" strokeWidth="1" />
        <path d="M11 13c1.3-1.8 4-2.9 7-2.3" fill="none" stroke="#fed7aa" strokeWidth="2" strokeLinecap="round" />
        <circle cx="21" cy="20" r="1.1" fill="#fdba74" />
      </svg>
    );
  }

  if (type === "block") {
    return (
      <svg viewBox="0 0 32 32" className={common} aria-label="blok">
        <path d="M6 11 16 5l10 6-10 6Z" fill="#a78bfa" />
        <path d="M6 11v10l10 6V17Z" fill="#7c3aed" />
        <path d="M26 11v10l-10 6V17Z" fill="#8b5cf6" />
        <path d="M6 11 16 5l10 6v10l-10 6-10-6Z" fill="none" stroke="#5b21b6" strokeWidth="1.2" />
      </svg>
    );
  }

  if (type === "box") {
    return (
      <svg viewBox="0 0 32 32" className={common} aria-label="kotak">
        <rect x="6" y="6" width="20" height="20" rx="4" fill="#60a5fa" stroke="#2563eb" strokeWidth="1.5" />
        <path d="M10 11h12M10 16h12M10 21h7" stroke="#dbeafe" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" className={common} aria-label="tambah">
      <circle cx="16" cy="16" r="12" fill="#34d399" />
      <path d="M16 9v14M9 16h14" stroke="#065f46" strokeWidth="4" strokeLinecap="round" />
      <circle cx="12" cy="11" r="3" fill="#bbf7d0" opacity="0.85" />
    </svg>
  );
}

function renderIconSet(
  icon: IconToken,
  key: string,
): React.ReactNode {
  return (
    <span
      key={key}
      className="mx-1 inline-flex max-w-full flex-wrap items-center gap-1 align-middle"
    >
      {Array.from({ length: icon.count }, (_, index) => (
        icon.kind === "asset" ? (
          <img
            key={`${key}-${index}`}
            src={icon.src}
            alt={icon.name}
            className="h-5 w-5 object-contain drop-shadow-[0_2px_3px_rgba(15,23,42,0.18)] sm:h-6 sm:w-6"
            loading="lazy"
          />
        ) : (
          <VisualIcon key={`${key}-${index}`} type={icon.type} />
        )
      ))}
    </span>
  );
}

function renderPowers(
  text: string,
  depth: number,
  keyPrefix: string,
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  while (cursor < text.length) {
    const powerStart = text.indexOf("^", cursor);
    if (powerStart === -1) {
      nodes.push(text.slice(cursor));
      break;
    }

    if (powerStart > cursor) {
      nodes.push(text.slice(cursor, powerStart));
    }

    const nextIndex = powerStart + 1;
    if (text[nextIndex] === "{") {
      const exponent = readBraced(text, nextIndex);
      if (exponent) {
        nodes.push(
          <sup
            key={`${keyPrefix}-pow-${key++}-${powerStart}`}
            className="text-[0.68em] leading-none"
          >
            {renderInlineMath(
              exponent.value,
              depth + 1,
              `${keyPrefix}-pow-braced-${powerStart}`,
            )}
          </sup>,
        );
        cursor = exponent.end;
        continue;
      }
    }

    const simpleExponent = text.slice(nextIndex).match(/^-?[a-zA-Z0-9]+/);
    if (simpleExponent) {
      nodes.push(
        <sup
          key={`${keyPrefix}-pow-${key++}-${powerStart}`}
          className="text-[0.68em] leading-none"
        >
          {simpleExponent[0]}
        </sup>,
      );
      cursor = nextIndex + simpleExponent[0].length;
      continue;
    }

    nodes.push("^");
    cursor = nextIndex;
  }

  return nodes;
}

function renderInlineMath(
  text: string,
  depth = 0,
  keyPrefix = "math",
): React.ReactNode[] {
  if (depth > 8) return [text];

  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  while (cursor < text.length) {
    const candidates = [
      { type: "icon", index: text.indexOf("{{", cursor) },
      { type: "frac", index: text.indexOf("\\frac{", cursor) },
      { type: "sqrtBrace", index: text.indexOf("\\sqrt{", cursor) },
      { type: "sqrtParen", index: text.indexOf("sqrt(", cursor) },
      { type: "sqrtSymbol", index: text.indexOf("√", cursor) },
    ].filter((item) => item.index >= 0);

    const next = candidates.sort((a, b) => a.index - b.index)[0];

    if (!next) {
      nodes.push(...renderPowers(text.slice(cursor), depth, `${keyPrefix}-tail`));
      break;
    }

    if (next.index > cursor) {
      nodes.push(
        ...renderPowers(
          text.slice(cursor, next.index),
          depth,
          `${keyPrefix}-text-${next.index}`,
        ),
      );
    }

    if (next.type === "sqrtBrace") {
      const radicand = readBraced(text, next.index + "\\sqrt".length);
      if (!radicand) {
        nodes.push(text.slice(next.index, next.index + "\\sqrt".length));
        cursor = next.index + "\\sqrt".length;
        continue;
      }

      nodes.push(
        renderSqrt(
          radicand.value,
          depth,
          `${keyPrefix}-sqrt-${key++}-${next.index}`,
        ),
      );
      cursor = radicand.end;
      continue;
    }

    if (next.type === "sqrtParen") {
      const radicand = readWrapped(text, next.index + "sqrt".length, "(", ")");
      if (!radicand) {
        nodes.push("sqrt");
        cursor = next.index + "sqrt".length;
        continue;
      }

      nodes.push(
        renderSqrt(
          radicand.value,
          depth,
          `${keyPrefix}-sqrt-${key++}-${next.index}`,
        ),
      );
      cursor = radicand.end;
      continue;
    }

    if (next.type === "sqrtSymbol") {
      const simpleRadicand = text.slice(next.index + 1).match(/^[a-zA-Z0-9]+/);
      if (simpleRadicand) {
        nodes.push(
          renderSqrt(
            simpleRadicand[0],
            depth,
            `${keyPrefix}-sqrt-${key++}-${next.index}`,
          ),
        );
        cursor = next.index + 1 + simpleRadicand[0].length;
        continue;
      }
      nodes.push("√");
      cursor = next.index + 1;
      continue;
    }

    if (next.type === "icon") {
      const icon = readIconToken(text, next.index);
      if (!icon) {
        nodes.push("{{");
        cursor = next.index + 2;
        continue;
      }

      nodes.push(
        renderIconSet(
          icon,
          `${keyPrefix}-icon-${key++}-${next.index}`,
        ),
      );
      cursor = icon.end;
      continue;
    }

    const fractionStart = next.index;
    const numerator = readBraced(text, fractionStart + "\\frac".length);
    const denominator = numerator ? readBraced(text, numerator.end) : null;

    if (!numerator || !denominator) {
      nodes.push(text.slice(fractionStart, fractionStart + 5));
      cursor = fractionStart + 5;
      continue;
    }

    nodes.push(
      <span
        key={`${keyPrefix}-frac-${key++}-${fractionStart}`}
        className="mx-0.5 inline-flex translate-y-[0.15em] flex-col items-center align-middle leading-none"
      >
        <span className="border-b border-current px-1 pb-0.5 text-[0.82em]">
          {renderInlineMath(
            numerator.value,
            depth + 1,
            `${keyPrefix}-num-${fractionStart}`,
          )}
        </span>
        <span className="px-1 pt-0.5 text-[0.82em]">
          {renderInlineMath(
            denominator.value,
            depth + 1,
            `${keyPrefix}-den-${fractionStart}`,
          )}
        </span>
      </span>
    );
    cursor = denominator.end;
  }

  return nodes;
}

export default function MathText({ text, className }: MathTextProps) {
  const parts = String(text ?? "")
    .split("\n")
    .flatMap((line, index, lines) => {
      const rendered = renderInlineMath(line, 0, `line-${index}`);
      if (index === lines.length - 1) return rendered;
      return [...rendered, <br key={`br-${index}`} />];
    });

  return <span className={className}>{parts}</span>;
}
