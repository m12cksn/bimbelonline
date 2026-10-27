# Grade 1 full visual conversion inventory

Scope: regular practice only; all active Grade 1 questions, not tryout. Existing scoring/persistence contracts must remain server authoritative. No production content changes authorized by this audit.

## Repository inventory (not a live database export)

| CSV | Material ID | Rows |
| --- | --- | --- |
| math1-membilang-10-40.csv | 41 | 40 |
| math1-addition-0-10-icons.csv | 42 | 40 |
| math1-subtraction-0-10-icons.csv | 43 | 40 |
| math1-addsub-shapes.csv | 44 | 40 |
| math1-shapes-basic.csv | 44 | 40 |
| math1-counting-11-20.csv | 45 | 40 |
| math1-addsub-upto20.csv | 46 | 40 |

280 archive rows; NOT 280 confirmed active questions. ID 44 conflicts across two different archives. Do not import or assign visuals by material ID/question number alone without verifying current question IDs and text.

## Conversion sequence

1. Reconcile active Grade 1 material/question IDs and content versions with live read-only inventory; confirm which ID 44 archive applies. Database connector is unavailable in this session.
2. Classify each active question: counting, addition/subtraction, comparison, sequence/pattern, shape recognition, matching, multipart. Preserve learning objective, response type and reviewed key.
3. Author typed public visual configuration per question/version; never use answer keys to generate student visuals. Story problems require explicit configuration, not guessed arithmetic from arbitrary text.
4. Render counting objects, grouped quantities, subtraction destinations, comparative sets, sequence slots and accessible shape choices. Keep original content as fallback for unconverted questions. Optional hints do not replace necessary question instructions.
5. Verify each converted question: mathematical equivalence, assets, keyboard/touch, reduced motion, wrong/right feedback, server submission, reload/persistence. Unsupported questions count as incomplete coverage.
6. Review coverage against active inventory before claiming all questions converted. Keep rollout in draft preview until review and deployment approval.

## Current limitations

The existing batch practice engine caps discovery at 20 questions, while archives have 40 rows each. Do not remove this cap blindly: assess server query limits, saved attempts and summary semantics first. Current visual arithmetic only supports strict bounded numeric expressions and preserves existing images; this is partial coverage. No live content access, per-question visual review or complete browser verification has occurred.
