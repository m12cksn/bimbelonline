# Server-derived score repair

Practice attempts and tryout summaries now ignore client totals and derive scores from stored answers scoped to authenticated user, material, run and question mode. Latest answer per question counts once. Tryout denominator includes unanswered questions; practice requires every question answered. Unavailable or oversized history fails closed.

Verification: 187 Jest tests across five suites passed; TypeScript noEmit passed; targeted ESLint and git diff --check passed. Tests mock database access; no live RLS, browser flow or production database checks performed.

Remaining release risks: direct database write permissions/RLS require inspection, attempt limits and score finalization are not transactional/idempotent, and catalog versions are not pinned. This patch does not solve those separate issues. No production deployment or merge authorized for this patch.
