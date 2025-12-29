import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("material_tryout_attempts")
    .select("id, material_id, score, total_questions, correct_count, wrong_count, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("fetch tryout list error:", error);
    return NextResponse.json({ ok: false, error: "Gagal memuat riwayat tryout" }, { status: 500 });
  }

  const items = (data ?? []).map((row) => {
    const raw = row as Record<string, unknown>;
    return {
      id: raw.id,
      materialId: typeof raw.material_id === "number" ? raw.material_id : 0,
      title: "",
      score: typeof raw.score === "number" ? raw.score : 0,
      totalQuestions:
        typeof raw.total_questions === "number" ? raw.total_questions : 0,
      correct: typeof raw.correct_count === "number" ? raw.correct_count : 0,
      wrong: typeof raw.wrong_count === "number" ? raw.wrong_count : 0,
      createdAt: typeof raw.created_at === "string" ? raw.created_at : "",
    };
  });

  const materialIds = Array.from(
    new Set(items.map((row) => row.materialId).filter((id) => id > 0))
  );

  if (materialIds.length > 0) {
    const { data: materialRows, error: materialError } = await supabase
      .from("materials")
      .select("id, title")
      .in("id", materialIds);

    if (materialError) {
      console.error("tryout materials lookup error:", materialError);
    } else {
      const titleMap = new Map<number, string>();
      (materialRows ?? []).forEach((row) => {
        if (row?.id && row.title) {
          titleMap.set(row.id, row.title);
        }
      });

      items.forEach((item) => {
        item.title = titleMap.get(item.materialId) ?? item.title;
      });
    }
  }

  return NextResponse.json({ ok: true, items });
}
