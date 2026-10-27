# Grade 1 missing-addend visuals — 27 October 2026

Draft PR #7 only. Regular Grade 1 practice; tryout unchanged.

Adds a bounded renderer for explicit missing-addend prompts with one unknown, non-negative known operand, and total at most 20. Preserves operand order and displays the unknown as ?. Children may mark the total apples and reset the marks. Marking does not submit an answer, grade, or calculate the missing value. Existing answer submission remains authoritative. Keyboard-native buttons and reduced-motion CSS are included.

Validation: TypeScript noEmit and targeted ESLint passed; Jest 15 suites / 280 tests passed. Public snapshot audit: 240 questions, 121 main visual matches, 11 fully visual multipart questions, 54/108 visual parts. This is renderer eligibility, not proof of browser QA: 132 questions eligible for complete coverage and 108 still without complete coverage. The 31 matching layouts are not counted as fully illustrated. Snapshot was not refreshed in this change.

New missing-addend browser/mobile interaction and production persistence are not yet verified. No database edits, merge, or production deployment.

Previous ordering browser QA: Space selected 11,13,18 in that order; removing position 2 returned focus to source 13; reset cleared slots and returned focus to the first source. These were preview interactions only, not stored student answers.
