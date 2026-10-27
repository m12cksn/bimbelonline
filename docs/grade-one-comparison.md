# Comparison visual increment

Adds aligned object grids for explicit reviewed pairwise comparisons/differences. Preserves operand order, displays no computed result or comparison sign, and keeps original question and answer controls. Pointer/keyboard buttons mark counted objects. Responsive grid uses ten/five columns; both groups share the same geometry. Existing images take precedence. Unspecified MCQs and multipart/matching prompts remain unsupported instead of guessing quantities from private keys.

11 additional prompts qualify against read-only 240-question snapshot: 77 total renderer-eligible; 163 remain unsupported. Existing practice cap still limits reachability. This is not verified completion coverage.

TypeScript noEmit, 216 Jest tests, targeted ESLint and diff check passed. Browser layout/interactions and live grading/persistence remain unverified. Preview sample at /preview/grade-one. No database or production changes.
