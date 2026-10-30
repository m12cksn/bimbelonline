# Grade 1 verification — 30 October 2026

## Scope
Regular practice in materials 41–46. No production database writes or student records were used. No merge or deployment performed.

## Changes
Answer fallback explanations no longer assume fractions for ordinary addition, subtraction, comparison, or unclassified prompts. Teacher-authored explanations and explicit simplification guidance remain intact. Grading, answer keys, scoring, and attempt limits are unchanged.

## Content audit
Read-only snapshot: 240 regular questions and 108 multipart parts. Current parser audit recognizes 123 main prompts, 54 parts, and 11 multipart questions with all parts recognized. There are also 31 legacy matching questions. These are renderer eligibility counts, not proof that every question has a complete or correct visual; image-based choices require separate inspection. Do not label the full Grade 1 bank finished from these counts.

## Integration verification
Existing PRs #10, #11, #12 and #13 were combined locally for compatibility checks. Follow-up fixes stay in their original PRs: remove invalid typography selector (#10), update relation-loading/key-redaction tests (#11), and import navigation Link (#13). No duplicate integration PR was opened.

## Remaining acceptance work
- Full browser inspection on phone, tablet and desktop, including image choices and input layouts.
- Helpful retry flow: regular practice currently locks after the first response; API attemptNumber denotes a whole-material run, so it must not be repurposed as a per-question retry counter.
- Durable resume without mixing different students or stale question versions.
- Human review of ambiguous content, including `Lengkapi: 11,9,__,7`.
- Difficulty sequencing based on reviewed question content, not guessed labels.

## Verification limitations
Unit tests and TypeScript checks are recorded in the PR. A production build needs public Supabase environment configuration. A build using placeholder configuration can verify compilation/prerendering only, not database connectivity. Preview browser QA remains unverified while Vercel preview access requires sign-in.
