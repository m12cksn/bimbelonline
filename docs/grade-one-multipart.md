# Multipart visual integration

Read-only live inventory found 108 public question-item rows across Grade 1 regular practice. No answer keys or student records read. Multipart items now invoke the same visual renderers as main prompts when no source image exists. Complete numeric/icon operations ending in equals with empty RHS are supported; banana/star icon support added. Ambiguous prompts still fallback.

Changed multipart wrapper from label to div to avoid nesting interactive buttons in an input label; input has explicit accessible name including item label/prompt. Existing answer JSON, submit/grading and result handling unchanged.

TypeScript noEmit, 256 Jest tests, targeted ESLint and diff check passed. No claim all 108 items or all multipart parents qualify; coverage reconciliation and browser integration testing remain pending. Previous top-level 109/240 count is no longer a complete measure of partial multipart support. Current 20-question cap remains a rollout blocker. No production/database writes.
