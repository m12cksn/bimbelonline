import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

interface Params {
  params: Promise<{ materialId: string }>;
}

async function getSupabase() {
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
            // ignore write failures
          }
        },
      },
    }
  );
}

function isMissingMaterialAttemptsTable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const err = error as { message?: string; code?: string; hint?: string };
  return (
    err.code === "PGRST205" ||
    err.message?.includes("material_attempts") ||
    err.hint?.includes("material_attempts")
  );
}

export async function GET(_: Request, props: Params) {
  const { materialId } = await props.params;
  const materialIdNum = Number(materialId);

  if (Number.isNaN(materialIdNum)) {
    return NextResponse.json({ error: "Invalid material id" }, { status: 400 });
  }

  const supabase = await getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("material_attempts")
    .select("user_id, score, attempt_number, created_at, profiles(full_name)")
    .eq("material_id", materialIdNum)
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(100);

  if (error && !isMissingMaterialAttemptsTable(error)) {
    console.error("leaderboard fetch error", error);
    return NextResponse.json(
      { error: "Gagal memuat leaderboard" },
      { status: 500 }
    );
  }

  type Row = {
    user_id: string;
    score: number | null;
    attempt_number: number | null;
    profiles: { full_name: string | null } | null;
  };

  let rows: Row[] = (data as Row[]) || [];

  // Fallback jika tabel material_attempts belum ada: gunakan akurasi dari question_attempts
  if (error && isMissingMaterialAttemptsTable(error)) {
    const { data: qaRows, error: qaError } = await supabase
      .from("question_attempts")
      .select("user_id, is_correct")
      .eq("material_id", materialIdNum);

    if (qaError) {
      console.error("leaderboard fallback error", qaError);
      return NextResponse.json(
        { error: "Gagal memuat leaderboard" },
        { status: 500 }
      );
    }

    const stats = new Map<
      string,
      { user_id: string; correct: number; total: number }
    >();

    (qaRows || []).forEach((r: { user_id: string; is_correct: boolean }) => {
      const current = stats.get(r.user_id) || {
        user_id: r.user_id,
        correct: 0,
        total: 0,
      };
      current.total += 1;
      if (r.is_correct) current.correct += 1;
      stats.set(r.user_id, current);
    });

    rows = Array.from(stats.values()).map((s) => ({
      user_id: s.user_id,
      score: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
      attempt_number: 1,
      profiles: { full_name: null },
    }));
  }

  const bestByUser = new Map<string, Row>();

  (rows || []).forEach((row: Row) => {
    const existing = bestByUser.get(row.user_id);
    const currentScore = row.score ?? 0;
    const existingScore = existing?.score ?? -1;

    if (!existing || currentScore > existingScore) {
      bestByUser.set(row.user_id, row);
    }
  });

  const leaderboard = Array.from(bestByUser.values())
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 10)
    .map((row, idx) => ({
      rank: idx + 1,
      userId: row.user_id,
      score: row.score ?? 0,
      attemptNumber: row.attempt_number ?? 1,
      fullName: row.profiles?.full_name ?? "Siswa",
      isMe: row.user_id === user.id,
    }));

  return NextResponse.json({ ok: true, leaderboard });
}
