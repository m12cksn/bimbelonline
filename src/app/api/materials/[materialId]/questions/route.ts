import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type QuestionRow = {
  id: string;
  question_number: number;
  type: "mcq" | "essay" | "multipart" | "drag_drop";
  prompt: string;
  helper_text?: string | null;
  question_image_url?: string | null;
  question_mode?: "practice" | "tryout" | null;
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ materialId: string }> }
) {
  const { materialId: materialIdRaw } = await params;
  const materialId = Number(materialIdRaw);
  if (Number.isNaN(materialId)) {
    return NextResponse.json(
      { ok: false, error: "materialId invalid" },
      { status: 400 }
    );
  }

  const url = new URL(req.url);
  const start = Number(url.searchParams.get("start") ?? "1");
  const end = Number(url.searchParams.get("end") ?? "1");
  const mode = (url.searchParams.get("mode") ?? "practice").toLowerCase();

  if (Number.isNaN(start) || Number.isNaN(end) || start < 1 || end < start) {
    return NextResponse.json(
      { ok: false, error: "range tidak valid" },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isGuest = !user;

  if (isGuest && mode === "tryout") {
    return NextResponse.json({ ok: true, questions: [] });
  }

  const effectiveEnd = isGuest ? Math.min(end, 4) : end;
  if (isGuest && start > effectiveEnd) {
    return NextResponse.json({ ok: true, questions: [] });
  }

  const dbClient =
    isGuest && serviceKey
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : supabase;

  let query = dbClient
    .from("questions")
    .select(
      "id, question_number, type, prompt, helper_text, question_image_url, question_mode"
    )
    .eq("material_id", materialId)
    .gte("question_number", start)
    .lte("question_number", effectiveEnd)
    .order("question_number", { ascending: true });

  if (mode === "tryout") {
    query = query.eq("question_mode", "tryout");
  } else {
    query = query.or("question_mode.is.null,question_mode.eq.practice");
  }

  const { data: questions, error: questionError } =
    await query.returns<QuestionRow[]>();

  if (questionError) {
    console.error("fetch questions range error", questionError);
    return NextResponse.json(
      { ok: false, error: "Gagal memuat soal" },
      { status: 500 }
    );
  }

  const questionList = questions ?? [];
  const questionIds = questionList.map((q) => q.id);

  const optionsByQuestion = new Map<string, unknown[]>();
  const targetsByQuestion = new Map<string, unknown[]>();
  const itemsByQuestion = new Map<string, unknown[]>();
  const partsByQuestion = new Map<string, unknown[]>();

  if (questionIds.length > 0) {
    const mcqIds = questionList.filter(q => q.type === "mcq").map(q => q.id);
    const dropIds = questionList.filter(q => q.type === "drag_drop").map(q => q.id);
    const partIds = questionList.filter(q => q.type === "multipart").map(q => q.id);
    const [
      { data: optionRows, error: optionsError },
      { data: targetRows, error: targetsError },
      { data: itemRows, error: itemsError },
      { data: partRows, error: partsError }
    ] = await Promise.all([
      mcqIds.length === 0 ? Promise.resolve({ data: [], error: null }) : dbClient
      .from("question_options")
      .select("question_id, label, value, image_url, sort_order")
      .in("question_id", mcqIds)
      .order("sort_order", { ascending: true }),
      dropIds.length === 0 ? Promise.resolve({ data: [], error: null }) : dbClient
      .from("question_drop_targets")
      .select("id, question_id, label, placeholder, sort_order")
      .in("question_id", dropIds)
      .order("sort_order", { ascending: true }),
      dropIds.length === 0 ? Promise.resolve({ data: [], error: null }) : dbClient
      .from("question_drop_items")
      .select("id, question_id, label, image_url, sort_order")
      .in("question_id", dropIds)
      .order("sort_order", { ascending: true }),
      partIds.length === 0 ? Promise.resolve({ data: [], error: null }) : dbClient
      .from("question_items")
      .select("id, question_id, label, prompt, image_url, sort_order")
      .in("question_id", partIds)
      .order("sort_order", { ascending: true })
    ]);

    if (optionsError) {
      console.error("question_options error", optionsError);
    }
    if (targetsError) {
      console.error("question_drop_targets error", targetsError);
    }
    if (itemsError) {
      console.error("question_drop_items error", itemsError);
    }
    if (partsError) {
      console.error("question_items error", partsError);
    }

    for (const row of optionRows || []) {
      const list = optionsByQuestion.get(row.question_id) || [];
      list.push({
        label: row.label,
        value: row.value,
        image_url: row.image_url,
        sort_order: row.sort_order,
      });
      optionsByQuestion.set(row.question_id, list);
    }

    for (const row of targetRows || []) {
      const list = targetsByQuestion.get(row.question_id) || [];
      list.push(row);
      targetsByQuestion.set(row.question_id, list);
    }

    for (const row of itemRows || []) {
      const list = itemsByQuestion.get(row.question_id) || [];
      list.push({
        id: row.id,
        label: row.label,
        image_url: row.image_url,
        sort_order: row.sort_order,
      });
      itemsByQuestion.set(row.question_id, list);
    }

    for (const row of partRows || []) {
      const list = partsByQuestion.get(row.question_id) || [];
      list.push(row);
      partsByQuestion.set(row.question_id, list);
    }
  }

  const normalizedQuestions = questionList.map((q) => ({
    ...q,
    options: optionsByQuestion.get(q.id) || [],
    drop_targets: targetsByQuestion.get(q.id) || [],
    drop_items: itemsByQuestion.get(q.id) || [],
    items: partsByQuestion.get(q.id) || [],
  }));

  return NextResponse.json({ ok: true, questions: normalizedQuestions });
}
