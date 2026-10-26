# Security repair 01: question delivery

Scope: stop the material question-list endpoint from disclosing option correctness and drag-and-drop answer mappings before submission.

## Changes
- Exclude `is_correct` and `correct_target_id` from database selections.
- Explicitly project option and draggable-item response fields, so unexpected secret columns cannot be forwarded.
- Remove unused answer-key fields from the quiz client types and normalization. Matching still submits item IDs and target IDs for server grading.

## Verification
- `npm test -- --runInBand`: 2 suites, 15 tests passed, including authenticated and guest route regressions with mocked database results containing secret fields.
- `npx tsc --noEmit`: passed.
- ESLint on the question route and its test: passed.
- ESLint including quiz_client.tsx: blocked by an existing set-state-in-effect error in the doodle reset effect, with two existing hook warnings. The baseline source contains the same effect. This patch does not change that behavior.
- `git diff --check`: passed.
- Full production build, browser interactions, live Supabase policies, and direct database access have not been verified.

## Remaining priorities
1. Enforce answer attempts and authorized explanation release on the server. The answer endpoint still returns answers after submission; this patch alone does not resolve all answer disclosure.
2. Compute session scores from persisted server-graded answers rather than browser counts.
3. Make answer/progress persistence reliable, atomic and safe against concurrent requests; fail visibly on save errors.
4. Replace permissive answer matching with typed mathematical rules and negative regression cases.
5. Audit role trust, RLS and paid access against the actual schema before making database changes.
6. Repair baseline lint issues and verify the student flow in a browser.

No database, production deployment, or merge is included.
