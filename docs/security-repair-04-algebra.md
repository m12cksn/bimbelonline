# Algebra answer equivalence

This extends repair 03. Existing shared essay/multipart grading now recognizes a bounded subset of algebra equivalence. It does not rewrite question prompts, keys, or historical results.

## Supported
- Reordered single-letter assignments: `y=2, x=3` matches `x=3, y=2`. Commas, semicolons or `dan` separate assignments. Every expected variable must appear exactly once; extras and duplicates fail. Variable case is significant.
- Scalar RHS equivalence reuses the existing fraction/decimal/mixed-number rules: `x=0.5` matches `x=1/2`.
- Polynomials: addition/subtraction, multiplication, implicit multiplication, parentheses, whole-number powers 0–8, and division by nonzero constants. For example `2(x+3)` matches `2x+6`; `(x+1)^2` matches `x²+2x+1`; `2a+3a` matches `5a`.
- Polynomial RHS forms retain the assigned variable: `y=1+2x` matches `y=2x+1`.
- Exact rational coefficients; no numeric sampling or floating-point tolerance.

## Boundaries
No general equation solving, inequality solving, functions, roots, variable denominators, domain-changing cancellations, or negative/fractional exponents. Unsupported legacy keys retain complete-representation matching rather than receiving speculative symbolic grading. The parser does not execute JavaScript or add libraries.

Inputs are bounded to 500 characters per polynomial, 128 tokens, 4 variables, degree 8, 128 terms, 512-bit coefficients, and 1024 parser steps. Malformed/over-budget supported-expression submissions fail. Variable identifiers are single Latin letters.

Legacy unit-bearing scalar keys still take precedence (`5m` can mean a quantity with a unit). Scalar thousands-separator conventions also remain, while polynomial coefficient separators are decimals. Typed per-question answer schemas are needed to eliminate these ambiguities. Accepting equivalent forms is appropriate for value/expression questions; prompts requiring a particular factored or expanded form need an explicit future rubric and content review before publication.

## Verification
- 168 tests passed across 4 suites, including 52 algebra cases and 4 answer-API integration cases with mocked database responses.
- TypeScript, ESLint on algebra/helper/API test files and `git diff --check`: passed.
- All 897 distinct essay keys from repository CSVs still accept their own complete representation; no claim that all keys are mathematically correct or that these are the live inventory.
- No full production build, browser flow, live Supabase/RLS or content publication was performed. The existing client lint blocker remains.

This change remains on the draft repair PR. No merge, deployment, database migration or live answer-key changes are included.
