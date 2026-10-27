# Faster Grade 1 regular practice

Grade 1 loads five authorized questions per request into a component-local cache; other grades retain ten-question pages. Guest catalog still stops at question 4. Cached questions are never persisted or shared between users. Parallelize four independent public-content relation reads in the existing endpoint, retaining explicit public field projections. Server auth/grade POST unchanged.

A newly submitted correct Grade 1 response advances after 800ms; wrong responses, failed POSTs, final question and other grades do not auto-advance. Navigation/unmount cancels timer. Reviewing previously answered questions does not schedule advancement. Success replaces Next button briefly with a status message. Final summary remains visible.

Validation: TypeScript passed; Jest 285 tests/15 suites passed. Targeted lint has no errors and two cache-lifetime useMemo dependency warnings. No measured latency claim; browser/integration QA still needed for cache reuse, auth changes, auto-advance, feedback timing and persisted answers. No production deployment.
