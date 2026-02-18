import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

interface Params {
  params: Promise<{ materialId: string }>;
}

export async function GET(_req: Request, props: Params) {
  const { materialId } = await props.params;
  const materialIdNum = Number(materialId);

  if (Number.isNaN(materialIdNum)) {
    return NextResponse.json({ error: "Invalid material id" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isAdmin = profile?.role === "admin";
  if (isAdmin) {
    return NextResponse.json({ attempts: [] });
  }

  const { data, error } = await supabase
    .from("material_tryout_attempts")
    .select("attempt_number, correct_count, wrong_count, total_questions, score")
    .eq("user_id", user.id)
    .eq("material_id", materialIdNum)
    .order("attempt_number", { ascending: true });

  if (error) {
    console.error("tryout summary fetch error:", error);
    return NextResponse.json(
      { error: "Gagal memuat laporan tryout", attempts: [] },
      { status: 500 }
    );
  }

  const attempts =
    data?.map((row) => ({
      attempt_number: row.attempt_number ?? 1,
      total_answered: row.total_questions ?? 0,
      correct: row.correct_count ?? 0,
      wrong: row.wrong_count ?? 0,
      score: row.score ?? 0,
    })) ?? [];

  return NextResponse.json({ attempts });
}

export async function POST(req: Request, props: Params) {
  const { materialId } = await props.params;
  const materialIdNum = Number(materialId);

  if (Number.isNaN(materialIdNum)) {
    return NextResponse.json({ error: "Invalid material id" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isAdmin = profile?.role === "admin";
  if (isAdmin) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const body = (await req.json()) as {
    attemptNumber?: number;
    correct?: number;
    totalAnswered?: number;
  };

  const correct = Number(body.correct ?? 0);
  const totalAnswered = Number(body.totalAnswered ?? 0);
  const wrong = Math.max(0, totalAnswered - correct);
  const score = totalAnswered > 0 ? Math.round((correct / totalAnswered) * 100) : 0;

  const { error } = await supabase.from("material_tryout_attempts").insert({
    user_id: user.id,
    material_id: materialIdNum,
    attempt_number: body.attemptNumber ?? 1,
    correct_count: correct,
    wrong_count: wrong,
    total_questions: totalAnswered,
    score,
  });

  if (error) {
    console.error("tryout summary insert error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan laporan tryout" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
