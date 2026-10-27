# Grade one full catalog and accumulated results

Removed frontend twenty-question truncation for Grade 1 regular practice only. Other grades retain twenty-question behavior. Guests are filtered to question numbers 1–4 to match existing questions API restrictions, avoiding empty later pages. Tryout metadata stays excluded.

Fixed setResults replacing all previous pages: merge new server responses into session-local results keyed by question ID. Final completion count and local recap can now retain all pages; duplicate response IDs do not inflate totals. This is NOT new durable resume or authoritative server summary work. Existing answer persistence/API behavior unchanged.

TypeScript noEmit, 261 Jest tests and targeted ESLint passed. Regression checks cover forty questions, original metadata ordering, guest limit, excluded tryout rows, forty retained results and repeated final ID. Tests are pure catalog/result helpers; real forty-step browser flow, refresh/resume and database grading still unverified. Visual conversion remains incomplete. No production merge/deploy or database writes.
