"use client";

import React from "react";

type MathTextProps = {
  text?: string | null;
  className?: string;
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
