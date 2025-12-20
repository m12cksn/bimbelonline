// app/api/materials/[materialId]/attempt-summary/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

interface MaterialParams {
  params: Promise<{ materialId: string }>;
}

// 🔹 Versi async, sama pola-nya seperti /api/materials/[id]/answer
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
            // ignore
          }
        },
      },
    }
  );
}

// GET → ambil semua percobaan user untuk materi ini
export async function GET(req: Request, props: MaterialParams) {
  const { materialId: materialIdStr } = await props.params;
  const materialId = parseInt(materialIdStr, 10);

  if (Number.isNaN(materialId)) {
    return NextResponse.json(
      { error: "Invalid material id", raw: materialIdStr },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseFromCookies();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("material_attempts")
    .select("attempt_number, correct, wrong, total_answered, score")
    .eq("user_id", user.id)
    .eq("material_id", materialId)
    .order("attempt_number", { ascending: true });

  if (error) {
    console.error("material_attempts GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attempts" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    attempts: data ?? [],
  });
}

// POST → simpan / update ringkasan satu percobaan
export async function POST(req: Request, props: MaterialParams) {
  const { materialId: materialIdStr } = await props.params;
  const materialId = parseInt(materialIdStr, 10);

  if (Number.isNaN(materialId)) {
    return NextResponse.json(
      { error: "Invalid material id", raw: materialIdStr },
      { status: 400 }
    );
  }

  const body = await req.json();
  const attemptNumberRaw = Number(body.attemptNumber);
  const correctRaw = Number(body.correct);
  const totalAnsweredRaw = Number(body.totalAnswered);

  const attemptNumber = Math.min(2, Math.max(1, attemptNumberRaw || 1));
  const totalAnswered = Math.max(0, totalAnsweredRaw || 0);
  const correct = Math.max(0, correctRaw || 0);
  const wrong = Math.max(0, totalAnswered - correct);
  const score = totalAnswered > 0 ? (correct / totalAnswered) * 100 : 0;

  const supabase = await createSupabaseFromCookies();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // cek apakah attempt ini sudah ada
  const { data: existing, error: existingError } = await supabase
    .from("material_attempts")
    .select("id")
    .eq("user_id", user.id)
    .eq("material_id", materialId)
    .eq("attempt_number", attemptNumber)
    .limit(1);

  if (existingError) {
    console.error("material_attempts select error:", existingError);
    return NextResponse.json(
      { error: "Failed to check existing attempt" },
      { status: 500 }
    );
  }

  let dbError = null;

  if (!existing || existing.length === 0) {
    const { error } = await supabase.from("material_attempts").insert({
      user_id: user.id,
      material_id: materialId,
      attempt_number: attemptNumber,
      correct,
      wrong,
      total_answered: totalAnswered,
      score,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    dbError = error;
  } else {
    const attemptId = existing[0].id;
    const { error } = await supabase
      .from("material_attempts")
      .update({
        correct,
        wrong,
        total_answered: totalAnswered,
        score,
        updated_at: new Date().toISOString(),
      })
      .eq("id", attemptId);

    dbError = error;
  }

  if (dbError) {
    console.error("material_attempts upsert error:", dbError);
    return NextResponse.json(
      { error: "Failed to save attempt" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    attemptNumber,
    correct,
    wrong,
    totalAnswered,
    score,
  });
}
