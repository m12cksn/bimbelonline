import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type CreatePayload = {
  materialId: number;
  questionNumber: number | null;
  prompt: string;
  helperText?: string | null;
  questionType?: "mcq" | "essay" | "drag_drop" | "multipart";
  options?: Array<{
    value: string;
    label: string;
    imageUrl?: string;
    targetKey?: string;
  }>;
  multipartItems?: Array<{
    label: string;
    prompt: string;
    answer: string;
    imageUrl?: string;
  }>;
  dropTargets?: string;
  correctAnswer?: string | null;
  explanation?: string | null;
  questionImageUrl?: string | null;
  correctAnswerImageUrl?: string | null;
  questionMode?: "practice" | "tryout";
};

export async function POST(req: Request) {
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

  const body = (await req.json()) as CreatePayload;
  if (!body.materialId || !body.prompt) {
    return NextResponse.json(
      { ok: false, error: "Material dan teks soal wajib diisi" },
      { status: 400 }
    );
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const creator = serviceKey
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : supabase;

  const { data, error } = await creator
    .from("questions")
    .insert({
      id: crypto.randomUUID(),
      material_id: body.materialId,
      question_number: body.questionNumber,
      type: body.questionType ?? "mcq",
      prompt: body.prompt,
      text: body.prompt,
      helper_text: body.helperText ?? null,
      correct_answer:
        body.questionType === "essay"
          ? body.correctAnswer ?? ""
          : body.correctAnswer ?? "",
      explanation: body.explanation ?? null,
      question_image_url: body.questionImageUrl ?? null,
      correct_answer_image_url: body.correctAnswerImageUrl ?? null,
      question_mode: body.questionMode ?? "practice",
    })
    .select(
      "id, material_id, question_number, type, prompt, helper_text, correct_answer, explanation, question_image_url, correct_answer_image_url, question_mode"
    )
    .single();

  if (error || !data) {
    console.error("Create question error:", error);
    return NextResponse.json(
      { ok: false, error: "Gagal membuat soal" },
      { status: 500 }
    );
  }

  if (body.questionType === "mcq" && body.options?.length) {
    const optionsPayload = body.options.map((opt) => ({
      question_id: data.id,
      label: opt.label,
      value: opt.value,
      image_url: opt.imageUrl ?? null,
      is_correct:
        body.correctAnswer &&
        (body.correctAnswer === opt.value || body.correctAnswer === opt.label),
    }));
    const { error: optionsError } = await creator
      .from("question_options")
      .insert(optionsPayload);
    if (optionsError) {
      console.error("Create question options error:", optionsError);
    }
  }

  if (body.questionType === "multipart" && body.multipartItems?.length) {
    const itemsPayload = body.multipartItems.map((item, idx) => ({
      question_id: data.id,
      label: item.label,
      prompt: item.prompt,
      image_url: item.imageUrl ?? null,
      sort_order: idx + 1,
    }));

    const { data: itemRows, error: itemError } = await creator
      .from("question_items")
      .insert(itemsPayload)
      .select("id");

    if (itemError) {
      console.error("Create question items error:", itemError);
    } else if (itemRows && itemRows.length > 0) {
      const answersPayload = itemRows
        .map((row, idx) => {
          const answer = body.multipartItems?.[idx]?.answer ?? "";
          if (!row?.id || !answer) return null;
          return {
            item_id: row.id,
            answer_text: answer,
          };
        })
        .filter(Boolean);

      if (answersPayload.length > 0) {
        const { error: answerError } = await creator
          .from("question_item_answers")
          .insert(answersPayload);
        if (answerError) {
          console.error("Create question item answers error:", answerError);
        }
      }
    }
  }

  if (body.questionType === "drag_drop") {
    const targetLabels = (body.dropTargets || "")
      .split(",")
      .map((label) => label.trim())
      .filter(Boolean);

    const { data: targetRows, error: targetError } = await creator
      .from("question_drop_targets")
      .insert(
        targetLabels.map((label, idx) => ({
          question_id: data.id,
          label,
          sort_order: idx + 1,
        }))
      )
      .select("id, label");

    if (targetError) {
      console.error("Create drop targets error:", targetError);
    }

    const targetMap = new Map(
      (targetRows || []).map((row) => [row.label, row.id])
    );

    const dropItems = (body.options || []).map((opt, idx) => ({
      question_id: data.id,
      label: opt.label,
      image_url: opt.imageUrl ?? null,
      correct_target_id: targetMap.get(opt.targetKey ?? "") ?? null,
      sort_order: idx + 1,
    }));

    const validDropItems = dropItems.filter((item) => item.correct_target_id);
    if (validDropItems.length > 0) {
      const { error: dropItemError } = await creator
        .from("question_drop_items")
        .insert(validDropItems);
      if (dropItemError) {
        console.error("Create drop items error:", dropItemError);
      }
    }
  }

  return NextResponse.json({ ok: true, id: data.id, question: data });
}
