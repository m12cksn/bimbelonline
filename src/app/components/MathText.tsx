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
    const fractionStart = text.indexOf("\\frac{", cursor);
    if (fractionStart === -1) {
      nodes.push(text.slice(cursor));
      break;
    }

    if (fractionStart > cursor) {
      nodes.push(text.slice(cursor, fractionStart));
    }

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
