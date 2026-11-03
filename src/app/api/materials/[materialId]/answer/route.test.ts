import { POST } from "./route";

const mockFilters: Record<string, Record<string, unknown>> = {};
const mockWrites: string[] = [];
let mockQuestion: Record<string, unknown> | null;
let mockSaveError = false;
let mockGuest = false;
const mockItems = [
  { id: "i1", label: "Satu", correct_target_id: "t1" },
  { id: "i2", label: "Dua", correct_target_id: "t2" },
];
const mockDb = {
  auth: { getUser: async () => ({ data: { user: mockGuest ? null : { id: "student" } } }) },
  from: (table: string) => {
    const filters: Record<string, unknown> = {};
    mockFilters[table] = filters;
    let writing = false;
    const query = {
      select: () => query,
      eq: (key: string, value: unknown) => { filters[key] = value; return query; },
      order: () => query,
      insert: () => { writing = true; mockWrites.push(table); return query; },
      update: () => { writing = true; mockWrites.push(table); return query; },
      single: async () => table === "profiles"
        ? { data: { role: "student" }, error: null }
        : { data: mockQuestion?.material_id === filters.material_id ? mockQuestion : null, error: null },
      maybeSingle: async () => ({ data: { value: "a" }, error: null }),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({
        data: table === "question_drop_items" ? mockItems : [],
        error: writing && table === "question_attempts" && mockSaveError ? { code: "save_failed" } : null,
      }).then(resolve),
    };
    return query;
  },
};
jest.mock("next/headers", () => ({ cookies: async () => ({ getAll: () => [], set: jest.fn() }) }));
jest.mock("@supabase/ssr", () => ({ createServerClient: () => mockDb }));
jest.mock("@supabase/supabase-js", () => ({ createClient: () => mockDb }));
jest.mock("next/server", () => ({ NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } }));

const submit = (body: unknown, materialId = "1") => POST(
  new Request("http://localhost/api/materials/1/answer", { method: "POST", body: JSON.stringify(body) }),
  { params: Promise.resolve({ materialId }) },
);

describe("answer submission boundaries", () => {
  beforeEach(() => {
    mockQuestion = { id: "q1", material_id: 1, question_number: 1, type: "mcq", prompt: "Pilih" };
    mockSaveError = false;
    mockGuest = false;
    mockWrites.length = 0;
  });

  test.each([null, [], {}, { questionId: "q1", selectedAnswer: null },
    { questionId: "q1", selectedAnswer: "a", attemptNumber: 3 },
    { questionId: "q1", selectedAnswer: "a".repeat(10001) },
  ])("rejects malformed payload %j without writes", async (body) => {
    expect((await submit(body)).status).toBe(400);
    expect(mockWrites).toEqual([]);
  });

  test("rejects broken JSON", async () => {
    const response = await POST(new Request("http://localhost", { method: "POST", body: "{" }), { params: Promise.resolve({ materialId: "1" }) });
    expect(response.status).toBe(400);
  });

  test.each(["1abc", "0", "-1", "1.2", "9007199254740992"])("rejects invalid material %s", async (id) => {
    expect((await submit({ questionId: "q1", selectedAnswer: "a" }, id)).status).toBe(400);
  });

  test.each([false, true])("rejects a question from another material for guest=%s", async (guest) => {
    mockGuest = guest;
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await submit({ questionId: "q1", selectedAnswer: "a" }, "2");
      expect(response.status).toBe(404);
      expect(mockFilters.questions).toEqual({ id: "q1", material_id: 2 });
      expect(mockWrites).toEqual([]);
    } finally { log.mockRestore(); }
  });

  test("does not return grading or advance progress when answer saving fails", async () => {
    mockSaveError = true;
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await submit({ questionId: "q1", selectedAnswer: "a" });
      expect(response.status).toBe(503);
      expect(await response.json()).not.toHaveProperty("isCorrect");
      expect(mockWrites).toEqual(["question_attempts"]);
    } finally { log.mockRestore(); }
  });

  test.each([
    [{ t1: "i1" }, false],
    [{ t1: "i1", t2: "i2" }, true],
    [{ t1: "Satu", t2: "Dua" }, true],
    [{ t1: "i1", t2: "Satu" }, false],
    [{ t1: "i1", t2: "i1" }, false],
    [{ t2: "i1", t1: "i2" }, false],
    [{ t1: "i1", t2: "i2", extra: "i3" }, false],
    [null, false],
    [["i1", "i2"], false],
    [{ t1: 123, t2: "i2" }, false],
  ])("requires complete unique matching for %j", async (answer, expected) => {
    mockQuestion!.type = "drag_drop";
    const response = await submit({ questionId: "q1", selectedAnswer: JSON.stringify(answer) });
    expect(response.status).toBe(200);
    expect((await response.json()).isCorrect).toBe(expected);
  });

  test("preserves successful authenticated answer and progress writes", async () => {
    const response = await submit({ questionId: "q1", selectedAnswer: "a", attemptNumber: 2 });
    expect((await response.json()).isCorrect).toBe(true);
    expect(mockWrites).toEqual(["question_attempts", "student_material_progress"]);
  });

  test.each([
    ["y=2,x=3", "x=3,y=2", true],
    ["2(x+3)", "2x+6", true],
    ["x=2,y=3", "x=3,y=2", false],
    ["2(x+2)", "2x+6", false],
  ])("grades algebra through the answer API: %s", async (answer, key, expected) => {
    mockQuestion!.type = "essay";
    mockQuestion!.correct_answer = key;
    const response = await submit({ questionId: "q1", selectedAnswer: answer });
    expect(response.status).toBe(200);
    expect((await response.json()).isCorrect).toBe(expected);
  });
  test.each(["4 + 4 = ?", "7 - 2 =", "Mana yang lebih besar?", "Hitung benda pada gambar"])(
    "keeps fallback feedback relevant to elementary questions: %s", async (prompt) => {
      mockQuestion = { ...mockQuestion, type: "essay", prompt, correct_answer: "8" };
      const response = await submit({ questionId: "q1", selectedAnswer: "1" });
      const result = await response.json();
      expect(result.isCorrect).toBe(false);
      expect(result.explanation).toContain("Jawaban benar: 8");
      expect(result.explanation).not.toMatch(/penyebut|pembilang|pecahan|desimal/);
    },
  );

  test("preserves an explanation written by the teacher", async () => {
    mockQuestion = { ...mockQuestion, type: "essay", prompt: "7 - 2 =", correct_answer: "5", explanation: "Kurangi dua apel dari tujuh apel." };
    const result = await (await submit({ questionId: "q1", selectedAnswer: "1" })).json();
    expect(result.explanation).toBe("Kurangi dua apel dari tujuh apel.");
  });

});
