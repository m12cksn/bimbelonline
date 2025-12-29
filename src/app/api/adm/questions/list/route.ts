import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthenticated" },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const materialId = Number(searchParams.get("materialId"));
  if (!materialId) {
    return NextResponse.json(
      { ok: false, error: "materialId wajib diisi" },
      { status: 400 }
    );
  }

  const { data: questions, error } = await supabase
    .from("questions")
    .select(
      "id, material_id, question_number, type, prompt, helper_text, correct_answer, explanation, question_image_url, correct_answer_image_url, question_mode"
    )
    .eq("material_id", materialId)
    .order("question_number", { ascending: true });

  if (error) {
    console.error("List questions error:", error);
    return NextResponse.json(
      { ok: false, error: "Gagal memuat soal" },
      { status: 500 }
    );
  }

  const questionList = questions ?? [];
  const questionIds = questionList.map((q) => q.id);

  const { data: optionRows } = questionIds.length
    ? await supabase
        .from("question_options")
        .select("question_id, label, value, image_url, is_correct, sort_order")
        .in("question_id", questionIds)
        .order("sort_order", { ascending: true })
    : { data: [] };

  const { data: targetRows } = questionIds.length
    ? await supabase
        .from("question_drop_targets")
        .select("id, question_id, label, placeholder, sort_order")
        .in("question_id", questionIds)
        .order("sort_order", { ascending: true })
    : { data: [] };

  const { data: itemRows } = questionIds.length
    ? await supabase
        .from("question_drop_items")
        .select("id, question_id, label, image_url, correct_target_id, sort_order")
        .in("question_id", questionIds)
        .order("sort_order", { ascending: true })
    : { data: [] };

  const { data: partRows } = questionIds.length
    ? await supabase
        .from("question_items")
        .select("id, question_id, label, prompt, image_url, sort_order")
        .in("question_id", questionIds)
        .order("sort_order", { ascending: true })
    : { data: [] };

  const itemIds = (partRows || []).map((row) => row.id);
  const { data: partAnswerRows } = itemIds.length
    ? await supabase
        .from("question_item_answers")
        .select("item_id, answer_text")
        .in("item_id", itemIds)
    : { data: [] };

  const optionsByQuestion = new Map<string, any[]>();
  for (const row of optionRows || []) {
    const list = optionsByQuestion.get(row.question_id) || [];
    list.push({
      value: row.value,
      label: row.label,
      imageUrl: row.image_url ?? undefined,
      isCorrect: row.is_correct ?? false,
    });
    optionsByQuestion.set(row.question_id, list);
  }

  const targetsByQuestion = new Map<string, any[]>();
  for (const row of targetRows || []) {
    const list = targetsByQuestion.get(row.question_id) || [];
    list.push({
      id: row.id,
      label: row.label,
      placeholder: row.placeholder ?? null,
    });
    targetsByQuestion.set(row.question_id, list);
  }

  const itemsByQuestion = new Map<string, any[]>();
  for (const row of itemRows || []) {
    const list = itemsByQuestion.get(row.question_id) || [];
    list.push({
      id: row.id,
      label: row.label,
      image_url: row.image_url ?? null,
      correct_target_id: row.correct_target_id,
    });
    itemsByQuestion.set(row.question_id, list);
  }

  const partAnswerByItem = new Map<string, string>();
  for (const row of partAnswerRows || []) {
    if (row?.item_id && typeof row.answer_text === "string") {
      partAnswerByItem.set(row.item_id, row.answer_text);
    }
  }

  const partsByQuestion = new Map<string, any[]>();
  for (const row of partRows || []) {
    const list = partsByQuestion.get(row.question_id) || [];
    list.push({
      id: row.id,
      label: row.label,
      prompt: row.prompt,
      image_url: row.image_url ?? null,
      answer: partAnswerByItem.get(row.id) ?? "",
    });
    partsByQuestion.set(row.question_id, list);
  }

  const normalized = questionList.map((q) => ({
    ...q,
    options: optionsByQuestion.get(q.id) || [],
    drop_targets: targetsByQuestion.get(q.id) || [],
    drop_items: itemsByQuestion.get(q.id) || [],
    items: partsByQuestion.get(q.id) || [],
  }));

  return NextResponse.json({ ok: true, questions: normalized });
}
