# Grade 1 visual follow-up — 27 October 2026

PR #7; no production merge or database writes.

Browser QA on bf9e272 preview: Space marks Apel 1 (aria-pressed=true); reset clears it (false); at 360x800, Apel 10 can be selected and document width 345 is within viewport width 360. This is pointer testing at mobile dimensions, not a physical touchscreen test. Viewport override reset afterwards. No student answers saved.

Added cupcake subtraction and the exact reviewed cookie subtraction story to existing icon arithmetic renderer. Counts and object identity retained; edited/unrecognized story text rejected. Existing grading unchanged.

Validation: TypeScript noEmit, targeted ESLint passed; Jest 15 suites / 283 tests passed. New cupcake/cookie rendering not yet browser-tested. Full inventory audit could not rerun because temporary public snapshot is no longer present; do not treat previous 108 remaining as newly verified or subtract mechanically. Refresh public content snapshot before updating totals.
