# Ordered number cards

Grade 1 essay prompts explicitly requesting ascending/descending order with 3–8 distinct source numbers up to 20 use controlled cards. Clicking appends a source number; clicking selected position removes it; reset clears. Output is comma-separated text in existing answer state, and legacy text input remains available. No sorting/answer key is computed or exposed. Submission disables cards. Ambiguous/duplicate/out-of-range prompts fallback.

TypeScript noEmit, 273 Jest tests and targeted ESLint passed. New grading compatibility test accepts correct comma-separated card output and rejects wrong order. Browser, server round-trip and persistence remain unverified. Preview sample at /preview/grade-one. No production/database changes.

Coverage audit now includes ordering parser, but multipart rendering does not yet use controlled ordering cards; audit eligibility alone must not be represented as implemented multipart support.
