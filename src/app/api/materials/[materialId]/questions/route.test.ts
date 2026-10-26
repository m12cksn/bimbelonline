import { GET } from "./route";

const mockSelections: Record<string, string> = {};
const mockRows: Record<string, unknown[]> = {
  questions: [{ id: "q1", question_number: 1, type: "drag_drop", prompt: "Pasangkan" }],
  question_options: [{ question_id: "q1", label: "A", value: "a", image_url: null, sort_order: 1, is_correct: true }],
  question_drop_targets: [{ id: "t1", question_id: "q1", label: "Target", sort_order: 1 }],
  question_drop_items: [{ id: "i1", question_id: "q1", label: "Item", image_url: null, sort_order: 1, correct_target_id: "t1" }],
  question_items: [],
};
const mockDb = {
  auth: { getUser: jest.fn() },
  from: jest.fn((table: string) => {
    const result = { data: mockRows[table], error: null };
    const query: Record<string, unknown> = {};
    query.select = (columns: string) => { mockSelections[table] = columns; return query; };
    for (const method of ["eq", "gte", "lte", "order", "or", "in"]) {
      query[method] = () => query;
    }
    query.returns = () => Promise.resolve(result);
    query.then = (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve);
    return query;
  }),
};

jest.mock("@/lib/supabaseServer", () => ({ createSupabaseServerClient: async () => mockDb }));
jest.mock("@supabase/supabase-js", () => ({ createClient: () => mockDb }));
jest.mock("next/server", () => ({
  NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) },
}));

describe("public question payload", () => {
  const originalServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  afterAll(() => {
    if (originalServiceKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceKey;
  });

  test.each([true, false])("does not disclose keys for guest=%s", async (guest) => {
    mockDb.auth.getUser.mockResolvedValue({ data: { user: guest ? null : { id: "student" } } });
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-only";
    const response = await GET(new Request("http://localhost/api/materials/1/questions?start=1&end=1"), {
      params: Promise.resolve({ materialId: "1" }),
    });
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(mockSelections.question_options).not.toContain("is_correct");
    expect(mockSelections.question_drop_items).not.toContain("correct_target_id");
    // Even unexpected secret columns from the data layer must not be forwarded.
    expect(JSON.stringify(payload)).not.toMatch(/is_correct|correct_target_id/);
    expect(payload.questions[0].options).toEqual([{ label: "A", value: "a", image_url: null, sort_order: 1 }]);
    expect(payload.questions[0].drop_items).toEqual([{ id: "i1", label: "Item", image_url: null, sort_order: 1 }]);
    expect(payload.questions[0].drop_targets[0].id).toBe("t1");
  });
});
