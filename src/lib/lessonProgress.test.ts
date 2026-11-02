import { parseLessonProgress, warmupScore } from './lessonProgress';
describe('lesson checkpoint boundaries', () => {
  test('accepts a resumable checkpoint and strips caller-supplied identity', () => {
    expect(parseLessonProgress({ lesson_stage: 4, lesson_completed: false, warmup_answers: [5, 6], user_id: 'someone-else', material_id: 99 })).toEqual({ lesson_stage: 4, lesson_completed: false, warmup_answers: [5, 6] });
  });
  test.each([null, [], { lesson_stage: -1, lesson_completed: false, warmup_answers: [] }, { lesson_stage: 6, lesson_completed: false, warmup_answers: [] }, { lesson_stage: 1, lesson_completed: 'yes', warmup_answers: [] }, { lesson_stage: 1, lesson_completed: false, warmup_answers: Array(6).fill(5) }, { lesson_stage: 1, lesson_completed: false, warmup_answers: [2.5] }])('rejects malformed checkpoints %p', value => expect(parseLessonProgress(value)).toBeNull());
  test('scores missing-addend warmup by the missing number, not total ten', () => {
    expect(warmupScore([5, 7, 8, 3, 10])).toBe(5);
    expect(warmupScore([4, 7, 8, 10, 10])).toBe(3);
  });
});
