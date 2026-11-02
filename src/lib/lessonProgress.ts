export type LessonProgress = {
  lesson_stage: number;
  lesson_completed: boolean;
  warmup_answers: number[];
};
export const emptyLessonProgress: LessonProgress = { lesson_stage: 0, lesson_completed: false, warmup_answers: [] };
export const warmupKeys = [5, 7, 8, 3, 10];
export function warmupScore(answers: number[]) {
  return answers.filter((answer, index) => answer === warmupKeys[index]).length;
}
export function parseLessonProgress(value: unknown): LessonProgress | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const p = value as Record<string, unknown>;
  if (!Number.isInteger(p.lesson_stage) || (p.lesson_stage as number) < 0 || (p.lesson_stage as number) > 5 || typeof p.lesson_completed !== 'boolean' || !Array.isArray(p.warmup_answers) || p.warmup_answers.length > 5 || p.warmup_answers.some(v => !Number.isInteger(v) || v < 0 || v > 10)) return null;
  return { lesson_stage: p.lesson_stage as number, lesson_completed: p.lesson_completed, warmup_answers: p.warmup_answers as number[] };
}
