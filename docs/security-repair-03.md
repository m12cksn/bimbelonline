# Security repair 03: mathematical answer validation

## Problem and behavior
The old grader extracted every number from an answer/key and accepted any overlap. Consequently `2` matched `2 + 3 = 5`, and `1/2` matched an integer key `2`. Extra text/numbers could also conceal a wrong answer.

The grader now parses a complete scalar, compares bounded rational integers with BigInt, and rejects trailing guesses and floating-point near misses. Supports integer/decimal/fraction equivalence, proper mixed-number notation, Unicode and LaTeX fractions, signed values, percentages, and a limited unit suffix vocabulary. Decimal comparison uses exact cross multiplication rather than a floating-point tolerance. No executable content or expression evaluation is introduced.

For a legacy arithmetic equation key with a scalar right-hand side, accept its complete representation or the final right-hand result; do not accept operands. Lists, algebra and numeric prose require the complete representation with whitespace normalization. Pure-text matching keeps legacy slash alternatives, but rejects extra words such as a contradictory `tidak`.

## Compatibility and limitations
- Preserve legacy thousands conventions for `10.000` and `10,000`; `0.125` remains decimal. Mixed grouping/decimal formats must be well formed. Ambiguous separators (for example `1.234` or two comma-separated integers without spaces) still need explicit typed content metadata and editorial review; no locale inference can resolve every legacy key.
- Preserve legacy omission of units from unit-bearing keys, but reject a submitted different/extra unit. No unit conversion is inferred. Percentage-to-decimal equivalence is supported.
- Complex responses do not have semantic algebra, list-order, or free-text rubric grading. Equivalent paraphrases/expressions may now be rejected instead of incorrectly passing via one matching number. Review affected published questions before merge/release and replace open-ended auto-graded keys with explicit validated rubrics or supported question types.
- Repository CSV content is not proof of the live database inventory or correctness of its keys.
- No live content, schema, production data or previous scores were modified.

## Verification
- 112 tests across 3 suites passed, including the original 13 validator tests and new positive/negative mathematical regressions.
- TypeScript and ESLint on validator/test files passed; `git diff --check` passed.
- Compatibility audit read all repository `docs/*.csv`: all 897 distinct nonempty essay keys accept their own complete representation. This checks basic compatibility only, not mathematical correctness, alternative-answer coverage or teaching quality.
- No browser, live Supabase, or full production-build verification was performed for this server-side helper change. Existing client lint blocker remains documented in repair 01.

Per-question attempt limits, authorized review, atomic persistence, authoritative aggregate scores and RLS remain separate unresolved release gates.
