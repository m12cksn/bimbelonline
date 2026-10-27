# Grade one preview browser QA — 27 October 2026

Tested live branch preview /preview/grade-one. Original subtraction moved the focused DOM button between groups and lost keyboard focus (active element aria-label null). Fix commit cd053918672970eaf8273d572d2b73f57f2c75f4 restores focus to the same object after movement/return and clarifies initial instruction. Vercel deployment succeeded; reloaded preview showed updated instruction. Enter moved object with active aria-label 'apel 1, kembalikan'; Enter returned object with active aria-label 'apel 1, pindahkan'.

Enter interaction checks set aria-pressed=true for counting apple, blank train slot, comparison object and SVG shape. Horizontal overflow false at 360, 768 and 1280 viewport widths; temporary viewport reset. These are sample page checks, not full manual visual/accessibility certification. No student data/submissions used.

Local TypeScript noEmit, targeted arithmetic ESLint and 224 Jest tests passed. Full real material flow, saved answers/resume, all 240 questions and cross-browser/reduced-motion interaction checks remain pending. Renderer eligibility remains 85/240, not 85 completed questions. No production merge/deploy or database writes.
