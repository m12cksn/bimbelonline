# Taman Tambah → BeSmartKids test

Implementation verified 31 October 2026. Scope is the addition-to-10 pilot only.

## Journey

- Standalone Taman Tambah: three examples, manipulatives, five warm-up questions; no account, database or transfer of results.
- Target: `/materials/42?start=practice&set=taman-tambah`.
- Guests sign in, then return to the exact same-origin test path. Arbitrary redirect URLs are rejected. Teacher routing remains unchanged.
- The regular practice engine receives 15 existing question IDs: 10 essay/numeric and five MCQ. No new database records, deletion, reordering or grading changes.
- Missing questions, tryout conversion or unsupported types block the set instead of silently showing fewer questions.
- Existing per-question answers/progress are still handled by the existing API. This is not a new isolated/versioned test session or separate leaderboard. Existing practice history may overlap; no new persistence/reload guarantees are claimed.

## Content verification

Read-only Supabase inspection confirmed material #42 is Grade 1 addition 0–10 and contains 40 practice records. Selected source question numbers: 3, 6, 8, 9, 10, 12, 13, 14, 15, 16, 17, 22, 23, 25, 27. Reviewed arithmetic, keys and MCQ options. Excludes subtraction, ordering and drag-and-drop. Standalone warm-up expressions are not repeated verbatim in the selected test; commutative equivalents and shared results can occur.

## Verification

- 18 Jest suites / 298 tests passed, including guest redirect and authenticated page receiving the exact 15-question catalog, stable selection, missing/changed set rejection and redirect allowlist.
- TypeScript passed; production build passed using placeholder Supabase configuration and `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1`.
- Initial build attempts exposed checkout symlink containment and font TLS issues; local dependencies were copied into the isolated worktree and system TLS enabled. No application configuration changed to work around them.
- Targeted ESLint on the new catalog helper/tests passed. `git diff --check` passed.
- Standalone browser run completed all five questions with correct 5/5 results and automatic progression. Pending-test notice is visible.
- Authenticated browser submission/persistence, full mobile-device QA and production verification remain pending. Mocked database tests do not verify live RLS or storage.

## Activation order

1. Review/merge this PR and verify its deployed revision on BeSmartKids.
2. Browser-check guest login return and authenticated 15-question rendering using a test account; verify saved attempts without writing to a real student's history.
3. Enable the standalone results CTA as a normal same-tab link to `https://besmartkids.id/materials/42?start=practice&set=taman-tambah`, replacing the disabled pending notice.

The standalone update intentionally leaves this CTA disabled until the main-site release is verified. Neither this PR nor production deployment is automatically merged by this task.
