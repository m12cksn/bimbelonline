# Sequence visual increment

Adds a numbered train for reviewed bounded numeric lists with exactly one blank. Retains source order and blank; computes no solution. Touch/keyboard buttons highlight positions. Existing images take precedence. Existing answer entry and server grading unchanged. Preview sample: /preview/grade-one.

Against the read-only 240-question snapshot: 13 additional sequence prompts qualify, for 66 renderer-eligible questions total; 174 remain unsupported. Eligibility is not browser-verified completion; existing 20-question practice cap still affects reachability. Unsupported prompts retain original rendering.

Verification: TypeScript noEmit, 202 Jest tests, targeted ESLint, git diff --check passed. Browser interaction/layout and live persistence remain unverified. No database or production changes.
