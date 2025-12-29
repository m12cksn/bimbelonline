import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type CsvRow = Record<string, string>;
type ExistingNumberRow = {
  material_id: number | null;
  question_number: number | null;
};

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const MAX_ROWS = 500;

async function deleteQuestionsByMaterialIds(
  supabase: SupabaseClient,
  materialIds: number[]
) {
  if (materialIds.length === 0) {
    return { ok: true as const };
  }

  const { data: questionRows, error: questionError } = await supabase
    .from("questions")
    .select("id")
    .in("material_id", materialIds);

  if (questionError) {
    console.error("replace import question fetch error:", questionError);
    return { ok: false as const, error: "Gagal mengambil data soal lama." };
  }

  const questionIds = (questionRows ?? [])
    .map((row) => row.id)
    .filter(Boolean) as string[];

  if (questionIds.length === 0) {
    return { ok: true as const };
  }

  const { data: itemRows, error: itemSelectError } = await supabase
    .from("question_items")
    .select("id")
    .in("question_id", questionIds);

  if (itemSelectError) {
    console.error("replace import item fetch error:", itemSelectError);
    return { ok: false as const, error: "Gagal membaca sub-soal lama." };
  }

  const itemIds = (itemRows ?? [])
    .map((item) => item.id)
    .filter(Boolean) as string[];

  if (itemIds.length > 0) {
    const { error: answerError } = await supabase
      .from("question_item_answers")
      .delete()
      .in("item_id", itemIds);

    if (answerError) {
      console.error("replace import answer delete error:", answerError);
      return {
        ok: false as const,
        error: "Gagal menghapus jawaban sub-soal lama.",
      };
    }
  }

  const deleteResults = await Promise.all([
    supabase.from("question_drop_items").delete().in("question_id", questionIds),
    supabase
      .from("question_drop_targets")
      .delete()
      .in("question_id", questionIds),
    supabase.from("question_options").delete().in("question_id", questionIds),
    supabase.from("question_items").delete().in("question_id", questionIds),
  ]);

  for (const result of deleteResults) {
    if (result.error) {
      console.error("replace import child delete error:", result.error);
      return { ok: false as const, error: "Gagal menghapus data soal lama." };
    }
  }

  const { error: questionDeleteError } = await supabase
    .from("questions")
    .delete()
    .in("id", questionIds);

  if (questionDeleteError) {
    console.error("replace import question delete error:", questionDeleteError);
    return { ok: false as const, error: "Gagal menghapus soal lama." };
  }

  return { ok: true as const };
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        const next = text[i + 1];
        if (next === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    if (char === "\r") {
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function normalizeHeader(headers: string[]) {
  const map = new Map<string, number>();
  headers.forEach((h, idx) => {
    map.set(h.trim().toLowerCase(), idx);
  });
  return map;
}

function getValue(row: string[], map: Map<string, number>, key: string) {
  const idx = map.get(key);
  if (idx === undefined) return "";
  return (row[idx] ?? "").trim();
}

function splitPreserveParens(value: string) {
  const parts: string[] = [];
  let current = "";
  let depth = 0;

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if (char === "(") {
      depth += 1;
      current += char;
      continue;
    }
    if (char === ")") {
      depth = Math.max(0, depth - 1);
      current += char;
      continue;
    }
    if (depth === 0 && (char === ";" || char === "|" || char === ",")) {
      if (current.trim()) {
        parts.push(current.trim());
      }
      current = "";
      continue;
    }
    current += char;
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

function parseArrayValue(raw: string) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // fallback split
  }
  return splitPreserveParens(raw).filter(Boolean);
}

function mapQuestionType(
  raw: string
): "mcq" | "essay" | "drag_drop" | "multipart" {
  const type = raw.trim().toLowerCase();
  if (type == "mcq" || type == "multiple_choice") return "mcq";
  if (type === "input" || type === "essay") return "essay";
  if (type === "dragdrop" || type === "drag_drop") return "drag_drop";
  if (type === "multipart" || type === "multi_part" || type === "multi-part")
    return "multipart";
  return "mcq";
}

function parseMultipartItems(raw: string) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => ({
          label: String(item.label ?? ""),
          prompt: String(item.prompt ?? ""),
          answer: String(item.answer ?? ""),
          imageUrl: item.imageUrl ? String(item.imageUrl) : undefined,
        }))
        .filter((item) => item.prompt && item.answer);
    }
  } catch {
    // fallback split
  }

  return raw
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const parts = entry.split("|").map((p) => p.trim());
      const [label, prompt, answer, imageUrl] = parts;
      return {
        label: label || "",
        prompt: prompt || "",
        answer: answer || "",
        imageUrl: imageUrl || undefined,
      };
    })
    .filter((item) => item.prompt && item.answer);
}

function buildFallbackExplanation(
  questionType: "mcq" | "essay" | "drag_drop" | "multipart",
  prompt: string,
  correctAnswer: string | null
) {
  if (!correctAnswer) return null;
  const lowerPrompt = prompt.toLowerCase();
  if (questionType === "drag_drop") {
    return `Jawaban benar: ${correctAnswer}. Cocokkan setiap item ke target yang sesuai.`;
  }
  if (questionType === "multipart") {
    return `Jawaban benar: ${correctAnswer}. Kerjakan tiap bagian satu per satu, lalu periksa kembali hasil akhirnya.`;
  }
  if (
    lowerPrompt.includes("lebih besar") ||
    lowerPrompt.includes("terkecil") ||
    lowerPrompt.includes("bandingkan") ||
    lowerPrompt.includes("urut")
  ) {
    return `Jawaban benar: ${correctAnswer}. Bandingkan pecahan dengan menyamakan penyebut atau ubah ke desimal agar mudah dibandingkan.`;
  }
  if (lowerPrompt.includes("+") || lowerPrompt.includes("jumlah")) {
    return `Jawaban benar: ${correctAnswer}. Samakan penyebut, jumlahkan pembilang, lalu sederhanakan jika perlu.`;
  }
  if (lowerPrompt.includes("-") || lowerPrompt.includes("selisih") || lowerPrompt.includes("sisa")) {
    return `Jawaban benar: ${correctAnswer}. Samakan penyebut, kurangi pembilang, lalu sederhanakan jika perlu.`;
  }
  if (lowerPrompt.includes("sederhanakan")) {
    return `Jawaban benar: ${correctAnswer}. Bagi pembilang dan penyebut dengan FPB agar pecahan paling sederhana.`;
  }
  return `Jawaban benar: ${correctAnswer}. Cek kembali langkah perhitunganmu dan pastikan penyebut sama sebelum menghitung.`;
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Form data tidak valid." }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ ok: false, error: "File CSV tidak ditemukan." }, { status: 400 });
  }

  const autoFillFromExplanation =
    String(form.get("autoFillFromExplanation") ?? "").toLowerCase() === "true";
  const replaceExisting =
    String(form.get("replaceExisting") ?? "").toLowerCase() === "true";

  const content = await file.text();
  const parsed = parseCsv(content);
  if (parsed.length < 2) {
    return NextResponse.json({ ok: false, error: "CSV kosong atau header tidak lengkap." }, { status: 400 });
  }

  const headers = parsed[0];
  const headerMap = normalizeHeader(headers);
  const dataRows = parsed.slice(1).slice(0, MAX_ROWS);

  const errors: Array<{ row: number; message: string }> = [];
  const parsedRows: Array<{
    materialId: number;
    questionNumber: number | null;
    questionMode: "practice" | "tryout";
    questionType: "mcq" | "essay" | "drag_drop" | "multipart";
    prompt: string;
    helperText: string | null;
    options: Array<{
      value: string;
      label: string;
      imageUrl?: string;
      targetKey?: string;
    }>;
    dropTargets: string[];
    multipartItems: Array<{
      label: string;
      prompt: string;
      answer: string;
      imageUrl?: string;
    }>;
    correctAnswer: string | null;
    explanation: string | null;
    questionImageUrl: string | null;
    correctImageUrl: string | null;
  }> = [];
  const pendingNumberRows: Array<{
    materialId: number;
    index: number;
  }> = [];

  dataRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const materialIdRaw = getValue(row, headerMap, "material_id");
    const questionText =
      getValue(row, headerMap, "prompt") ||
      getValue(row, headerMap, "question_text");
    const questionModeRaw = getValue(row, headerMap, "question_mode");
    const questionTypeRaw = getValue(row, headerMap, "question_type");
    const questionNumberRaw = getValue(row, headerMap, "question_number");
    const helperText = getValue(row, headerMap, "helper_text");

    const materialId = Number(materialIdRaw);
    const rowIssues: string[] = [];

    if (!materialId || Number.isNaN(materialId)) {
      rowIssues.push("material_id tidak valid");
    }

    if (!questionText) {
      rowIssues.push("prompt atau question_text wajib diisi");
    }

    const questionMode =
      questionModeRaw.toLowerCase() === "tryout" ? "tryout" : "practice";
    let questionType = mapQuestionType(questionTypeRaw);

    const optionValues = [
      getValue(row, headerMap, "option_a"),
      getValue(row, headerMap, "option_b"),
      getValue(row, headerMap, "option_c"),
      getValue(row, headerMap, "option_d"),
    ];

    const correctAnswerRaw = getValue(row, headerMap, "correct_answer");
    const optionImages = [
      getValue(row, headerMap, "option_a_image_url"),
      getValue(row, headerMap, "option_b_image_url"),
      getValue(row, headerMap, "option_c_image_url"),
      getValue(row, headerMap, "option_d_image_url"),
    ];

    const options = optionValues
      .map((value, idx) => {
        const label = value;
        const imageUrl = optionImages[idx] || undefined;
        if (!value && !imageUrl) return null;
        return {
          value: value || label || String.fromCharCode(65 + idx),
          label: label || value || String.fromCharCode(65 + idx),
          imageUrl: imageUrl || undefined,
        };
      })
      .filter(Boolean) as Array<{
        value: string;
        label: string;
        imageUrl?: string;
      }>;

    const dragItems = parseArrayValue(getValue(row, headerMap, "drag_items"));
    const dropTargetsRaw = parseArrayValue(
      getValue(row, headerMap, "drop_targets")
    );
    const multipartItems = parseMultipartItems(
      getValue(row, headerMap, "multipart_items")
    );

    const isLikelyEssay =
      questionType === "drag_drop" &&
      dragItems.length === 0 &&
      dropTargetsRaw.length === 0 &&
      options.length === 0 &&
      Boolean(correctAnswerRaw);

    if (isLikelyEssay) {
      questionType = "essay";
    }

    const hasDragDrop = questionType === "drag_drop";

    const targetKeys =
      dropTargetsRaw.length > 0
        ? dropTargetsRaw
        : dragItems.map((_, idx) => String.fromCharCode(65 + idx));

    const mappedOptions =
      hasDragDrop && dragItems.length > 0
        ? dragItems.map((item, idx) => ({
            value: item,
            label: item,
            targetKey: targetKeys[idx] ?? String.fromCharCode(65 + idx),
          }))
        : options;

    let correctAnswer = correctAnswerRaw;
    const explanationRaw = getValue(row, headerMap, "explanation");
    const correctImageUrl = getValue(row, headerMap, "correct_image_url") || null;

    if (questionType === "mcq") {
      if (!options.length) {
        rowIssues.push("opsi A-D kosong untuk soal pilihan ganda");
      }
      if (!correctAnswer) {
        rowIssues.push("correct_answer wajib untuk pilihan ganda");
      } else {
        const letter = correctAnswer.toUpperCase();
        if (["A", "B", "C", "D"].includes(letter)) {
          const idx = letter.charCodeAt(0) - 65;
          const option = optionValues[idx];
          if (!option) {
            rowIssues.push(`correct_answer ${letter} tidak memiliki opsi`);
          } else {
            correctAnswer = option;
          }
        }
      }
    }

    if (questionType === "essay") {
      if (!correctAnswer && autoFillFromExplanation && explanationRaw) {
        const match = explanationRaw.match(/-?\d+(?:[.,]\d+)?/);
        if (match?.[0]) {
          correctAnswer = match[0].replace(",", ".");
        }
      }
      if (!correctAnswer) {
        rowIssues.push("correct_answer wajib untuk input");
      }
    }

    if (questionType === "drag_drop") {
      if (dragItems.length === 0) {
        rowIssues.push("drag_items kosong");
      }
      if (dropTargetsRaw.length === 0) {
        rowIssues.push("drop_targets kosong");
      }
      if (
        dragItems.length > 0 &&
        dropTargetsRaw.length > 0 &&
        dragItems.length !== dropTargetsRaw.length
      ) {
        rowIssues.push("drag_items dan drop_targets tidak sama panjang");
      }
    }
    if (questionType === "multipart") {
      if (multipartItems.length === 0) {
        rowIssues.push("multipart_items kosong");
      }
    }

    if (rowIssues.length > 0) {
      errors.push({ row: rowNumber, message: rowIssues.join("; ") });
      return;
    }

    const questionNumber = questionNumberRaw ? Number(questionNumberRaw) : null;

    const fallbackExplanation =
      explanationRaw ||
      buildFallbackExplanation(questionType, questionText, correctAnswer);

    parsedRows.push({
      materialId,
      questionNumber,
      questionMode,
      questionType,
      prompt: questionText,
      helperText: helperText || null,
      options: mappedOptions,
      dropTargets: targetKeys,
      multipartItems,
      correctAnswer: correctAnswer || null,
      explanation: fallbackExplanation,
      questionImageUrl: getValue(row, headerMap, "question_image_url") || null,
      correctImageUrl,
    });

    if (!questionNumber) {
      pendingNumberRows.push({ materialId, index: parsedRows.length - 1 });
    }
  });

  if (replaceExisting && errors.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "Masih ada error CSV. Perbaiki dulu sebelum replace.",
        errors,
      },
      { status: 400 }
    );
  }

  if (parsedRows.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Tidak ada baris valid untuk diimport.", errors },
      { status: 400 }
    );
  }

  const materialIds = Array.from(
    new Set(parsedRows.map((row) => row.materialId))
  );

  if (replaceExisting) {
    const replaceResult = await deleteQuestionsByMaterialIds(
      supabase,
      materialIds
    );
    if (!replaceResult.ok) {
      return NextResponse.json(
        { ok: false, error: replaceResult.error },
        { status: 500 }
      );
    }
  }

  if (pendingNumberRows.length > 0) {
    const materialIds = Array.from(
      new Set(pendingNumberRows.map((row) => row.materialId))
    );

    const { data: existingNumbers, error: numberError } = await supabase
      .from("questions")
      .select("material_id, question_number")
      .in("material_id", materialIds)
      .order("question_number", { ascending: false });

    if (numberError) {
      console.error("import csv number lookup error:", numberError);
      return NextResponse.json(
        { ok: false, error: "Gagal membaca nomor soal." },
        { status: 500 }
      );
    }

    const maxByMaterial = new Map<number, number>();
    (existingNumbers ?? []).forEach((row) => {
      const typed = row as ExistingNumberRow;
      const materialId = Number(typed.material_id ?? 0);
      const numberVal = Number(typed.question_number ?? 0);
      if (!materialId || Number.isNaN(numberVal)) return;
      const current = maxByMaterial.get(materialId) ?? 0;
      if (numberVal > current) maxByMaterial.set(materialId, numberVal);
    });

    pendingNumberRows.forEach((row) => {
      const current = maxByMaterial.get(row.materialId) ?? 0;
      const next = current + 1;
      maxByMaterial.set(row.materialId, next);
      const target = parsedRows[row.index];
      target.questionNumber = next;
    });
  }

  let inserted = 0;

  for (const row of parsedRows) {
    const { data: question, error: questionError } = await supabase
      .from("questions")
      .insert({
        id: crypto.randomUUID(),
        material_id: row.materialId,
        question_number: row.questionNumber,
        type: row.questionType,
        prompt: row.prompt,
        text: row.prompt,
        helper_text: row.helperText,
        correct_answer:
          row.questionType === "essay"
            ? row.correctAnswer ?? ""
            : row.correctAnswer ?? "",
        explanation: row.explanation,
        question_image_url: row.questionImageUrl,
        correct_answer_image_url: row.correctImageUrl,
        question_mode: row.questionMode,
      })
      .select("id")
      .single();

    if (questionError || !question) {
      console.error("import csv insert error:", questionError);
      return NextResponse.json(
        { ok: false, error: "Gagal menyimpan sebagian data.", errors },
        { status: 500 }
      );
    }

    const questionId = question.id as string;

    if (row.questionType === "mcq" && row.options.length > 0) {
      const optionsPayload = row.options.map((opt) => ({
        question_id: questionId,
        label: opt.label,
        value: opt.value,
        image_url: opt.imageUrl ?? null,
        is_correct:
          row.correctAnswer &&
          (row.correctAnswer === opt.value || row.correctAnswer === opt.label),
      }));
      const { error: optionError } = await supabase
        .from("question_options")
        .insert(optionsPayload);
      if (optionError) {
        console.error("import csv option error:", optionError);
      }
    }

    if (row.questionType === "multipart") {
      const itemsPayload = row.multipartItems.map((item, idx) => ({
        question_id: questionId,
        label: item.label || String.fromCharCode(97 + idx),
        prompt: item.prompt,
        image_url: item.imageUrl ?? null,
        sort_order: idx + 1,
      }));
      const { data: itemRows, error: itemError } = await supabase
        .from("question_items")
        .insert(itemsPayload)
        .select("id, sort_order");

      if (itemError) {
        console.error("import csv multipart item error:", itemError);
      } else if (itemRows && itemRows.length > 0) {
        const sortedItems = [...itemRows].sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
        );
        const answersPayload = sortedItems
          .map((itemRow, idx) => {
            const answer = row.multipartItems[idx]?.answer ?? "";
            if (!itemRow?.id || !answer) return null;
            return {
              item_id: itemRow.id,
              answer_text: answer,
            };
          })
          .filter(Boolean);

        if (answersPayload.length > 0) {
          const { error: answerError } = await supabase
            .from("question_item_answers")
            .insert(answersPayload);
          if (answerError) {
            console.error("import csv multipart answer error:", answerError);
          }
        }
      }
    }

    if (row.questionType === "drag_drop") {
      const { data: targetRows, error: targetError } = await supabase
        .from("question_drop_targets")
        .insert(
          row.dropTargets.map((label, idx) => ({
            question_id: questionId,
            label,
            sort_order: idx + 1,
          }))
        )
        .select("id, label, sort_order");

      if (targetError) {
        console.error("import csv target error:", targetError);
      }

      const orderedTargets = [...(targetRows || [])].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      );
      const targetIdsByIndex = orderedTargets.map((target) => target.id);
      const targetMap = new Map(
        (targetRows || []).map((target) => [target.label, target.id])
      );

      const itemsPayload = row.options
        .map((opt, idx) => {
          const targetId =
            targetIdsByIndex[idx] ?? targetMap.get(opt.targetKey ?? "") ?? null;
          return {
            question_id: questionId,
            label: opt.label,
            image_url: opt.imageUrl ?? null,
            correct_target_id: targetId,
            sort_order: idx + 1,
          };
        })
        .filter((item) => item.correct_target_id);

      if (itemsPayload.length > 0) {
        const { error: itemsError } = await supabase
          .from("question_drop_items")
          .insert(itemsPayload);
        if (itemsError) {
          console.error("import csv drop item error:", itemsError);
        }
      }
    }

    inserted += 1;
  }

  return NextResponse.json({
    ok: true,
    inserted,
    skipped: errors.length,
    errors,
  });
}
