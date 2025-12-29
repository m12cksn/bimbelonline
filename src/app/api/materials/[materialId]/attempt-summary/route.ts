// app/api/materials/[materialId]/attempt-summary/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

interface MaterialParams {
  params: Promise<{ materialId: string }>;
}

type SummaryRow = {
  attempt_number: number;
  total_answered: number;
  correct: number;
  wrong: number;
  score: number;
};

// Helper Supabase dengan cookies
async function createSupabaseFromCookies() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // ignore di edge runtime
          }
        },
      },
    }
  );
}

// =====================================================
// GET → ambil ringkasan percobaan dari VIEW
// =====================================================
export async function GET(_req: Request, props: MaterialParams) {
  const { materialId: materialIdStr } = await props.params;
  const materialId = parseInt(materialIdStr, 10);

  if (Number.isNaN(materialId)) {
    return NextResponse.json(
      { error: "Invalid material id", raw: materialIdStr },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseFromCookies();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const userId = user.id;

  // ⬇️ PAKAI VIEW yang sudah kamu buat
  const { data, error } = await supabase
    .from("question_attempts")
    .select("attempt_number, question_id, is_correct, created_at")
    .eq("user_id", userId)
    .eq("material_id", materialId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("question_attempts GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attempts", attempts: [] },
      { status: 500 }
    );
  }

  const normalizeAttemptNumber = (value: unknown) => {
    if (value === 2 || value === "2") return 2;
    if (value === 1 || value === "1" || value === 0 || value === "0") return 1;
    if (value === null || value === undefined) return 1;
    return null;
  };

  const latestByQuestionAttempt = new Map<string, SummaryRow>();
  const questionStatus: Array<{
    attempt_number: number;
    question_id: string;
    is_correct: boolean;
  }> = [];
  for (const row of data ?? []) {
    const attemptNumber = normalizeAttemptNumber(row.attempt_number);
    const questionId = String(row.question_id ?? "");
    if (!attemptNumber || !questionId) continue;
    const key = `${attemptNumber}-${questionId}`;
    if (latestByQuestionAttempt.has(key)) continue;
    latestByQuestionAttempt.set(key, {
      attempt_number: attemptNumber,
      total_answered: 0,
      correct: row.is_correct ? 1 : 0,
      wrong: row.is_correct ? 0 : 1,
      score: 0,
    });
    questionStatus.push({
      attempt_number: attemptNumber,
      question_id: questionId,
      is_correct: !!row.is_correct,
    });
  }

  const byAttempt = new Map<number, { total: number; correct: number }>();
  for (const row of latestByQuestionAttempt.values()) {
    const stats = byAttempt.get(row.attempt_number) ?? { total: 0, correct: 0 };
    stats.total += 1;
    stats.correct += row.correct ? 1 : 0;
    byAttempt.set(row.attempt_number, stats);
  }

  const attempts = Array.from(byAttempt.entries())
    .sort(([a], [b]) => a - b)
    .map(([attemptNumber, stats]) => {
      const wrong = Math.max(0, stats.total - stats.correct);
      const score =
        stats.total > 0
          ? Math.round((stats.correct / stats.total) * 100)
          : 0;
      return {
        attempt_number: attemptNumber,
        total_answered: stats.total,
        correct: stats.correct,
        wrong,
        score,
      } satisfies SummaryRow;
    });

  return NextResponse.json({ attempts, question_status: questionStatus });
}

// =====================================================
// POST → sekarang tidak perlu hitung apa pun
// frontend kamu tetap bisa panggil POST tanpa error
// =====================================================
export async function POST(_req: Request, _props: MaterialParams) {
  // VIEW sudah otomatis menghitung dari material_answer_log,
  // jadi di sini kita cukup balas sukses supaya tidak mengganggu flow di client.
  return NextResponse.json({ ok: true });
}
