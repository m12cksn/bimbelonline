import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type UpdatePayload = {
  questionId: string;
  materialId?: number | null;
  questionNumber?: number | null;
  prompt?: string | null;
  helperText?: string | null;
  questionType?: "mcq" | "essay" | "drag_drop" | "multipart";
  questionImageUrl?: string;
  correctAnswerImageUrl?: string;
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

  const body = (await req.json()) as UpdatePayload;
  const questionId = body.questionId;
  if (!questionId) {
    return NextResponse.json(
      { ok: false, error: "ID soal tidak valid" },
      { status: 400 }
    );
  }

  const updatePayload: Record<string, unknown> = {};
  if (body.questionImageUrl !== undefined) {
    updatePayload.question_image_url = body.questionImageUrl || null;
  }
  if (body.correctAnswerImageUrl !== undefined) {
    updatePayload.correct_answer_image_url =
      body.correctAnswerImageUrl || null;
  }
  if (body.materialId !== undefined) {
    updatePayload.material_id = body.materialId;
  }
  if (body.questionNumber !== undefined) {
    updatePayload.question_number = body.questionNumber;
  }
  if (body.prompt !== undefined) {
    updatePayload.prompt = body.prompt;
    updatePayload.text = body.prompt;
  }
  if (body.helperText !== undefined) {
    updatePayload.helper_text = body.helperText;
  }
  if (body.questionType !== undefined) {
    updatePayload.type = body.questionType;
  }
  if (body.correctAnswer !== undefined) {
    updatePayload.correct_answer =
      body.questionType === "essay"
        ? body.correctAnswer ?? ""
        : body.correctAnswer ?? "";
  }
  if (body.explanation !== undefined) {
    updatePayload.explanation = body.explanation;
  }
  if (body.questionMode !== undefined) {
    updatePayload.question_mode = body.questionMode;
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json(
      { ok: false, error: "Tidak ada perubahan" },
      { status: 400 }
    );
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const updater = serviceKey
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : supabase;

  const { error } = await updater
    .from("questions")
    .update(updatePayload)
    .eq("id", questionId);

  if (error) {
    console.error("Update question error:", error);
    return NextResponse.json(
      { ok: false, error: "Gagal memperbarui soal" },
      { status: 500 }
    );
  }

  const questionType = body.questionType ?? null;

  if (questionType === "mcq") {
    await updater.from("question_drop_items").delete().eq("question_id", questionId);
    await updater
      .from("question_drop_targets")
      .delete()
      .eq("question_id", questionId);
    const { data: existingItems } = await updater
      .from("question_items")
      .select("id")
      .eq("question_id", questionId);
    const itemIds = (existingItems || []).map((row) => row.id);
    if (itemIds.length > 0) {
      await updater.from("question_item_answers").delete().in("item_id", itemIds);
    }
    await updater.from("question_items").delete().eq("question_id", questionId);

    if (body.options && body.options.length > 0) {
      await updater.from("question_options").delete().eq("question_id", questionId);
      const optionsPayload = body.options.map((opt) => ({
        question_id: questionId,
        label: opt.label,
        value: opt.value,
        image_url: opt.imageUrl ?? null,
        is_correct:
          body.correctAnswer &&
          (body.correctAnswer === opt.value || body.correctAnswer === opt.label),
      }));
      const { error: optionsError } = await updater
        .from("question_options")
        .insert(optionsPayload);
      if (optionsError) {
        console.error("Update question options error:", optionsError);
      }
    }
  } else if (questionType === "drag_drop") {
    await updater.from("question_options").delete().eq("question_id", questionId);
    await updater.from("question_drop_items").delete().eq("question_id", questionId);
    await updater
      .from("question_drop_targets")
      .delete()
      .eq("question_id", questionId);
    const { data: existingItems } = await updater
      .from("question_items")
      .select("id")
      .eq("question_id", questionId);
    const itemIds = (existingItems || []).map((row) => row.id);
    if (itemIds.length > 0) {
      await updater.from("question_item_answers").delete().in("item_id", itemIds);
    }
    await updater.from("question_items").delete().eq("question_id", questionId);

    const targetLabels = (body.dropTargets || "")
      .split(",")
      .map((label) => label.trim())
      .filter(Boolean);

    const { data: targetRows, error: targetError } = await updater
      .from("question_drop_targets")
      .insert(
        targetLabels.map((label, idx) => ({
          question_id: questionId,
          label,
          sort_order: idx + 1,
        }))
      )
      .select("id, label");

    if (targetError) {
      console.error("Update drop targets error:", targetError);
    }

    const targetMap = new Map(
      (targetRows || []).map((row) => [row.label, row.id])
    );

    const dropItems = (body.options || []).map((opt, idx) => ({
      question_id: questionId,
      label: opt.label,
      image_url: opt.imageUrl ?? null,
      correct_target_id: targetMap.get(opt.targetKey ?? "") ?? null,
      sort_order: idx + 1,
    }));

    const validDropItems = dropItems.filter((item) => item.correct_target_id);
    if (validDropItems.length > 0) {
      const { error: dropItemError } = await updater
        .from("question_drop_items")
        .insert(validDropItems);
      if (dropItemError) {
        console.error("Update drop items error:", dropItemError);
      }
    }
  } else if (questionType === "multipart") {
    await updater.from("question_options").delete().eq("question_id", questionId);
    await updater.from("question_drop_items").delete().eq("question_id", questionId);
    await updater
      .from("question_drop_targets")
      .delete()
      .eq("question_id", questionId);
    const { data: existingItems } = await updater
      .from("question_items")
      .select("id")
      .eq("question_id", questionId);
    const itemIds = (existingItems || []).map((row) => row.id);
    if (itemIds.length > 0) {
      await updater.from("question_item_answers").delete().in("item_id", itemIds);
    }
    await updater.from("question_items").delete().eq("question_id", questionId);

    if (body.multipartItems && body.multipartItems.length > 0) {
      const itemsPayload = body.multipartItems.map((item, idx) => ({
        question_id: questionId,
        label: item.label,
        prompt: item.prompt,
        image_url: item.imageUrl ?? null,
        sort_order: idx + 1,
      }));

      const { data: itemRows, error: itemError } = await updater
        .from("question_items")
        .insert(itemsPayload)
        .select("id");

      if (itemError) {
        console.error("Update question items error:", itemError);
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
          const { error: answerError } = await updater
            .from("question_item_answers")
            .insert(answersPayload);
          if (answerError) {
            console.error("Update question item answers error:", answerError);
          }
        }
      }
    }
  } else if (questionType === "essay") {
    await updater.from("question_options").delete().eq("question_id", questionId);
    await updater.from("question_drop_items").delete().eq("question_id", questionId);
    await updater
      .from("question_drop_targets")
      .delete()
      .eq("question_id", questionId);
    const { data: existingItems } = await updater
      .from("question_items")
      .select("id")
      .eq("question_id", questionId);
    const itemIds = (existingItems || []).map((row) => row.id);
    if (itemIds.length > 0) {
          await updater.from("question_item_answers").delete().in("item_id", itemIds);
    }
    await updater.from("question_items").delete().eq("question_id", questionId);
  }

  return NextResponse.json({ ok: true });
}
