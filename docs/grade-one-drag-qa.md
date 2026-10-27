# Grade one matching drag verification

Added dnd-kit pointer drag handles with an 8px activation threshold, touch-action none only on handle, drag overlay and droppable target fieldsets. Existing tap/keyboard card selection retained. Only unassigned items can be dragged; assigned items must first be cancelled. Submitted state disables dragging and selection. Existing answer JSON unchanged.

Browser reproduction found default rectangle intersection selected the source group despite pointer release over destination. Fix 79019693b10d53e815931062cf679de2290e2942 uses pointerWithin. Vercel build succeeded. Retested actual pointer drag from source three-apple handle to second target: second target aria-pressed true, source disabled; Enter cancelled assignment and source became available again.

TypeScript noEmit, targeted ESLint and 256 existing Jest tests passed. No automated drag test was added; browser result is a sample pointer check only. Real touch devices, mobile scroll, submitted state, out-of-zone/cancel behavior, and live server persistence remain pending. No student submissions, database writes or production merge/deploy.
