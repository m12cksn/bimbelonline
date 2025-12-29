import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type RawRow = Record<string, unknown>;

function isMissingTable(error: unknown, table: string) {
  if (!error || typeof error !== "object") return false;
  const err = error as { message?: string; code?: string; hint?: string };
  return (
    err.code === "PGRST205" ||
    err.message?.includes(table) ||
    err.hint?.includes(table)
  );
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });
  }

  const { data: practiceRows, error: practiceError } = await supabase
    .from("material_attempts")
    .select(
      "id, material_id, attempt_number, score, correct_count, wrong_count, total_questions, created_at, materials ( title )"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (practiceError && !isMissingTable(practiceError, "material_attempts")) {
    console.error("practice attempts error:", practiceError);
    return NextResponse.json(
      { ok: false, error: "Gagal memuat riwayat latihan" },
      { status: 500 }
    );
  }

  let practiceItems: RawRow[] = practiceRows ?? [];

  if (practiceError && isMissingTable(practiceError, "material_attempts")) {
    const { data: qaRows, error: qaError } = await supabase
      .from("question_attempts")
      .select(
        "material_id, question_id, attempt_number, is_correct, created_at, materials ( title )"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (qaError) {
      console.error("question_attempts fallback error:", qaError);
    } else {
      const latestByQuestion = new Map<string, RawRow>();

      (qaRows ?? []).forEach((row) => {
        const attemptNum = row.attempt_number === 2 ? 2 : 1;
        const key = `${row.material_id}-${attemptNum}-${row.question_id}`;
        if (!latestByQuestion.has(key)) {
          latestByQuestion.set(key, row);
        }
      });

      const grouped = new Map<string, RawRow>();
      latestByQuestion.forEach((row) => {
        const attemptNum = row.attempt_number === 2 ? 2 : 1;
        const key = `${row.material_id}-${attemptNum}`;
        const current = grouped.get(key);
        const correct = (current?.correct_count as number | undefined) ?? 0;
        const wrong = (current?.wrong_count as number | undefined) ?? 0;
        const isCorrect = row.is_correct === true;
        const updatedCorrect = correct + (isCorrect ? 1 : 0);
        const updatedWrong = wrong + (isCorrect ? 0 : 1);
        const latestCreated =
          typeof row.created_at === "string" ? row.created_at : current?.created_at;

        grouped.set(key, {
          id: `qa-${key}`,
          material_id: row.material_id,
          attempt_number: attemptNum,
          correct_count: updatedCorrect,
          wrong_count: updatedWrong,
          total_questions: updatedCorrect + updatedWrong,
          score:
            updatedCorrect + updatedWrong > 0
              ? Math.round(
                  (updatedCorrect / (updatedCorrect + updatedWrong)) * 100
                )
              : 0,
          created_at: latestCreated,
          materials: row.materials,
        });
      });
      practiceItems = Array.from(grouped.values());
    }
  }

  const { data: tryoutRows, error: tryoutError } = await supabase
    .from("material_tryout_attempts")
    .select(
      "id, material_id, attempt_number, score, correct_count, wrong_count, total_questions, created_at, materials ( title )"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (tryoutError && !isMissingTable(tryoutError, "material_tryout_attempts")) {
    console.error("tryout attempts error:", tryoutError);
    return NextResponse.json(
      { ok: false, error: "Gagal memuat riwayat tryout" },
      { status: 500 }
    );
  }

  const tryoutItems: RawRow[] =
    tryoutError && isMissingTable(tryoutError, "material_tryout_attempts")
      ? []
      : tryoutRows ?? [];

  const normalize = (row: RawRow, mode: "practice" | "tryout") => {
    const materialsValue = row.materials;
    const materialObj = Array.isArray(materialsValue)
      ? (materialsValue[0] as RawRow | undefined) ?? null
      : (materialsValue as RawRow | null);

    const correct =
      typeof row.correct_count === "number"
        ? row.correct_count
        : Number(row.correct_count ?? 0);
    const wrong =
      typeof row.wrong_count === "number"
        ? row.wrong_count
        : Number(row.wrong_count ?? 0);
    const total =
      typeof row.total_questions === "number"
        ? row.total_questions
        : Math.max(correct + wrong, 0);

    return {
      id: String(row.id ?? ""),
      materialId:
        typeof row.material_id === "number" ? row.material_id : Number(row.material_id ?? 0),
      title: typeof materialObj?.title === "string" ? materialObj.title : null,
      mode,
      attemptNumber:
        typeof row.attempt_number === "number" && row.attempt_number > 0
          ? row.attempt_number
          : typeof row.attempt_number === "string"
          ? Number(row.attempt_number) || null
          : null,
      score:
        typeof row.score === "number"
          ? row.score
          : Math.round((correct / Math.max(total, 1)) * 100),
      correct,
      wrong,
      totalQuestions: total,
      createdAt: typeof row.created_at === "string" ? row.created_at : "",
    };
  };

  const items = [
    ...practiceItems.map((row) => normalize(row, "practice")),
    ...tryoutItems.map((row) => normalize(row, "tryout")),
  ].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return NextResponse.json({ ok: true, items });
}
