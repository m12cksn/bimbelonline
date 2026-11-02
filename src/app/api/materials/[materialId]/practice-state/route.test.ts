import { GET } from './route';
let mockUser: { id: string } | null = { id: 'owner' };
let mockRole = 'student';
let mockRows: unknown[] = [];
const mockFilters: unknown[][] = [];
jest.mock('@/lib/supabaseServer', () => ({ createSupabaseServerClient: async () => ({ auth: { getUser: async () => ({ data: { user: mockUser } }) }, from: (table: string) => {
  if (table === 'profiles') return { select: () => ({ eq: () => ({ single: async () => ({ data: { role: mockRole } }) }) }) };
  const query = { select: () => query, eq: (...values: unknown[]) => { mockFilters.push(values); return query; }, order: () => query, limit: async () => ({ data: mockRows, error: null }) }; return query;
} }) }));
const read = (materialId = '42') => GET(new Request('https://example.test'), { params: Promise.resolve({ materialId }) });
beforeEach(() => { mockUser = { id: 'owner' }; mockRole = 'student'; mockRows = []; mockFilters.length = 0; });
test('requires authentication before reading attempt data', async () => { mockUser = null; expect((await read()).status).toBe(401); expect(mockFilters).toHaveLength(0); });
test('invalid material does not query attempts', async () => { expect((await read('42bad')).status).toBe(400); expect(mockFilters).toHaveLength(0); });
test('rejects non-student access', async () => { mockRole = 'teacher'; expect((await read()).status).toBe(403); });
test('restores only latest attempted practice answers with an owner filter', async () => {
  const question = { id: 'q1', question_mode: 'practice', explanation: 'Explanation', correct_answer: '5', correct_answer_image_url: null };
  mockRows = [{ question_id: 'q1', selected_answer: '5', is_correct: true, questions: question }, { question_id: 'q1', selected_answer: '4', is_correct: false, questions: question }, { question_id: 'tryout', selected_answer: '7', is_correct: true, questions: { ...question, question_mode: 'tryout' } }];
  const response = await read(); const body = await response.json();
  expect(mockFilters).toContainEqual(['user_id', 'owner']); expect(mockFilters).toContainEqual(['material_id', 42]);
  expect(body.answers).toEqual({ q1: '5' }); expect(body.results.q1.isCorrect).toBe(true);
  expect(response.headers.get('cache-control')).toBe('private, no-store');
});
