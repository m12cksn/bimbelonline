# Grade one regular practice visuals

Three themes: orchard, aquarium and toy shelf. Explicit bounded arithmetic only; existing images take precedence. Addition displays two labeled groups. Subtraction moves clicked objects into a separate destination, leaves empty slots at original positions and supports return/reset. Short arrival animation respects reduced motion. Original grading and answer state remain separate.

Preview: /preview/grade-one shows three subtraction themes and one addition example without student data or persistence. It is a design sample, not live question inventory. Unsupported story/pattern prompts retain original rendering; not all Grade 1 questions have been converted.

Verification: TypeScript noEmit, 176 Jest tests, targeted component ESLint and diff check passed. Tests cover existing grading and parser; browser interaction, focus after movement, mobile layouts and live persistence still need verification. No production merge or deploy performed.
