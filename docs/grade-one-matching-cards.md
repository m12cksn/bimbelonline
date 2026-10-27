# Grade one matching cards

Grade 1 regular matching questions use native toggle buttons grouped by target fieldset instead of dropdown menus. Public source item labels/images are shown; selecting an item updates the existing target-ID to item-ID answer JSON. Selecting again clears it; items assigned elsewhere are disabled to avoid duplicate assignments. Submission disables interaction. Other grades/tryout unchanged.

This is interaction/layout support, not proof every matching question has useful pictures. Labels without images remain text cards. No keys exposed or new database writes introduced. Current practice cap still limits coverage.

TypeScript noEmit, 256 existing Jest tests and targeted ESLint passed before a text-only preview cleanup. No new browser verification yet; next gate is select, cancel, reassign, keyboard and submitted states. Preview: /preview/grade-one. Full active-question coverage remains unverified; no production merge/deploy.
