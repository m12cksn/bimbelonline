import { summarizeStoredAnswers } from "./serverScore";
import { POST as practice } from "@/app/api/materials/[materialId]/attempts/route";
import { POST as tryout } from "@/app/api/materials/[materialId]/tryout-summary/route";

let mockQuestions: { id: string }[];
let mockAnswers: { question_id: string; is_correct: boolean; created_at: string }[];
let mockHistory: { attempt_number: number; score: number }[];
let mockErrorTable: string;
let mockUser: { id: string } | null;
const mockReads: { table: string; filters: Record<string, unknown>; mode?: string }[] = [];
const mockWrites: { table: string; value: Record<string, unknown> }[] = [];
const mockDb = {
  auth: { getUser: async () => ({ data: { user: mockUser } }) },
  from: (table: string) => {
    const read = { table, filters: {} as Record<string, unknown>, mode: "" };
    mockReads.push(read);
    const result = () => ({ data: table === "questions" ? mockQuestions : table === "question_attempts" ? mockAnswers : table === "material_attempts" ? mockHistory : [],
      error: mockErrorTable === table ? { code: "db_failed" } : null });
    const query = {
      select: () => query,
      eq: (key: string, value: unknown) => { read.filters[key] = value; return query; },
      or: (mode: string) => { read.mode = mode; return query; },
      order: () => query,
      limit: () => query,
      single: async () => ({ data: { role: "student" }, error: null }),
      insert: (value: Record<string, unknown>) => { mockWrites.push({ table, value }); return query; },
      update: (value: Record<string, unknown>) => { mockWrites.push({ table, value }); return query; },
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(result()).then(resolve),
    };
    return query;
  },
};
jest.mock("@/lib/supabaseServer", () => ({ createSupabaseServerClient: async () => mockDb }));
jest.mock("@supabase/ssr", () => ({ createServerClient: () => mockDb }));
jest.mock("next/headers", () => ({ cookies: async () => ({ getAll: () => [], set: jest.fn() }) }));
jest.mock("next/server", () => ({ NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } }));
const time = "2026-10-26T01:00:00Z";
const submit = (handler: (req: Request, props: { params: Promise<{ materialId: string }> }) => Promise<Response>, body: unknown = {}, materialId = "1") => handler(
  new Request("http://localhost", { method: "POST", body: JSON.stringify(body) }),
  { params: Promise.resolve({ materialId }) },
);

beforeEach(() => {
  mockQuestions = [{ id: "q1" }, { id: "q2" }];
  mockAnswers = [{ question_id: "q1", is_correct: true, created_at: time }, { question_id: "q2", is_correct: false, created_at: time }];
  mockHistory = []; mockErrorTable = ""; mockUser = { id: "student-a" };
  mockReads.length = 0; mockWrites.length = 0;
});

describe("server-derived score routes", () => {
  test.each([practice, tryout])("ignores forged perfect score and body user ID", async (handler) => {
    const response = await submit(handler, { correctCount: 999, wrongCount: -1, totalQuestions: 1, correct: 999, totalAnswered: 1, user_id: "student-b", attemptNumber: 1 });
    expect(response.status).toBe(200);
    const write = mockWrites.find((item) => item.table.startsWith("material_"))!;
    expect(write.value).toMatchObject({ user_id: "student-a", material_id: 1, correct_count: 1, wrong_count: 1, total_questions: 2, score: 50 });
    expect(mockReads.find((item) => item.table === "question_attempts")!.filters)
      .toEqual({ user_id: "student-a", material_id: 1, attempt_number: 1 });
  });

  test("separates practice/tryout catalogs", async () => {
    await submit(practice);
    expect(mockReads.find((item) => item.table === "questions")!.mode).toBe("question_mode.is.null,question_mode.eq.practice");
    mockReads.length = 0;
    await submit(tryout);
    expect(mockReads.find((item) => item.table === "questions")!.filters).toEqual({ material_id: 1, question_mode: "tryout" });
  });

  test("practice selects the next server-side material run", async () => {
    mockHistory = [{ attempt_number: 1, score: 10 }];
    await submit(practice, { attemptNumber: 1 });
    expect(mockReads.find((item) => item.table === "question_attempts")!.filters.attempt_number).toBe(2);
  });

  test("tryout includes unanswered questions in the denominator", async () => {
    mockAnswers = mockAnswers.slice(0, 1);
    const response = await submit(tryout, { totalAnswered: 1, correct: 1 });
    expect(response.status).toBe(200);
    expect(mockWrites[0].value).toMatchObject({ total_questions: 2, score: 50, wrong_count: 1 });
  });

  test("incomplete practice cannot mark the material complete", async () => {
    mockAnswers = mockAnswers.slice(0, 1);
    expect((await submit(practice)).status).toBe(409);
    expect(mockWrites).toEqual([]);
  });

  test.each([practice, tryout])("does not save a score without stored answers", async (handler) => {
    mockAnswers = [];
    expect((await submit(handler, { correct: 100 })).status).toBe(409);
    expect(mockWrites).toEqual([]);
  });

  test.each(["questions", "question_attempts"])("fails closed on %s query errors", async (table) => {
    mockErrorTable = table;
    expect((await submit(tryout)).status).toBe(503);
    expect(mockWrites).toEqual([]);
  });

  test.each([practice, tryout])("requires authentication", async (handler) => {
    mockUser = null;
    expect((await submit(handler)).status).toBe(401);
    expect(mockWrites).toEqual([]);
  });

  test.each([practice, tryout])("rejects invalid material IDs", async (handler) => {
    expect((await submit(handler, {}, "1bad")).status).toBe(400);
  });

  test("rejects a forged tryout run number", async () => {
    expect((await submit(tryout, { attemptNumber: 3 })).status).toBe(400);
    expect(mockWrites).toEqual([]);
  });

  test("rejects over-budget catalogs/history", async () => {
    mockQuestions = Array.from({ length: 201 }, (_, i) => ({ id: String(i) }));
    expect((await submit(tryout)).status).toBe(503);
    mockQuestions = [{ id: "q1" }];
    mockAnswers = Array.from({ length: 501 }, () => ({ question_id: "q1", is_correct: true, created_at: time }));
    expect((await submit(tryout)).status).toBe(503);
    expect(mockWrites).toEqual([]);
  });
});

describe("stored answer aggregation", () => {
  test("counts only the latest answer per catalog question", () => {
    expect(summarizeStoredAnswers(["q1", "q2"], [
      { question_id: "q1", is_correct: true, created_at: time },
      { question_id: "q1", is_correct: false, created_at: "2026-10-26T02:00:00Z" },
      { question_id: "foreign", is_correct: true, created_at: time },
    ])).toEqual({ totalQuestions: 2, answered: 1, correct: 0, wrong: 2, score: 0 });
  });
  test("does not inflate counts from duplicate rows", () => {
    expect(summarizeStoredAnswers(["q1"], [mockAnswers[0], mockAnswers[0]]).score).toBe(100);
  });
  test("rejects conflicting simultaneous records", () => {
    expect(() => summarizeStoredAnswers(["q1"], [mockAnswers[0], { ...mockAnswers[0], is_correct: false }])).toThrow();
  });
});
