# Security repair 02: answer submission integrity

## Changed behavior
- Bind question lookup to both question ID and material ID. A question submitted under another material returns 404 without writing attempts or progress, for authenticated and guest requests.
- Reject malformed JSON, non-object bodies, missing/oversized answers, invalid IDs and invalid legacy run numbers with 400.
- Drag-and-drop grading requires all configured items exactly once in their correct targets. A single correct pair is no longer enough. Preserve legacy label answers only when labels identify items uniquely; reject duplicates using either IDs or labels.
- Safely handle null, array and non-string values in multipart/drag JSON instead of crashing.
- Return 503 with no grading/key payload when the answer insert fails, and do not advance progress after that failure.
- The quiz client checks HTTP success and grading response shape before updating question results, statistics or navigation. Error responses are not counted as incorrect answers.

## Verification
- `npm test -- --runInBand`: 3 suites, 41 tests passed (26 new endpoint cases).
- `npx tsc --noEmit`: passed.
- ESLint on answer route/test: passed.
- `git diff --check`: passed.
- Existing client lint error in the doodle reset effect remains as reported in repair 01.
- Database responses are mocked in endpoint tests; no live RLS, full production build, or browser verification was performed. The client response check was inspected and typechecked; no browser test is claimed.

## Remaining release blockers
The old `attempt_number` identifies a whole-material run, not two submissions to each question. Correctness still needs a separate server-authoritative question lifecycle, versioned keys, transaction locking, idempotency and authorized review. Do not relabel this patch as enforcing two attempts.

The repository does not contain a complete migration for the core question/attempt/progress tables. Inspect the actual schema, constraints and policies in a nonproduction environment before designing and applying a migration. Do not deduplicate or delete historical attempts speculatively.

Progress writes after a successful answer insert still have legacy error handling. Answer and progress are not atomic, and retries/concurrent submissions are not idempotent. Browser-controlled aggregate scores, permissive numeric validation, direct-table key access, role trust, guest content access and RLS remain separate priorities.

No production data, merge, or deployment was changed.
