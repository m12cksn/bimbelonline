import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type AttemptRow = {
  user_id: string | null;
  question_id: string | null;
  is_correct: boolean | null;
  created_at?: string | null;
};

type StatRow = {
  userId: string;
  total: number;
  correct: number;
};

export async function GET() {
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

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const admin = serviceKey
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : supabase;

  const latestByQuestion = new Map<string, AttemptRow>();
  const pageSize = 5000;
  let page = 0;

  while (true) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error } = await admin
      .from("question_attempts")
      .select("user_id, question_id, is_correct, created_at")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("global leaderboard fetch error:", error);
      return NextResponse.json(
        { ok: false, error: "Gagal memuat leaderboard" },
        { status: 500 }
      );
    }

    const rows = (data ?? []) as AttemptRow[];
    for (const row of rows) {
      const userId = row.user_id ?? "";
      const questionId = row.question_id ?? "";
      if (!userId || !questionId) continue;
      const key = `${userId}-${questionId}`;
      if (latestByQuestion.has(key)) continue;
      latestByQuestion.set(key, row);
    }

    if (rows.length < pageSize) break;
    page += 1;
  }

  const stats = new Map<string, StatRow>();
  for (const row of latestByQuestion.values()) {
    const userId = row.user_id ?? "";
    if (!userId) continue;
    const current = stats.get(userId) ?? { userId, total: 0, correct: 0 };
    current.total += 1;
    if (row.is_correct) current.correct += 1;
    stats.set(userId, current);
  }

  const userIds = Array.from(stats.keys());
  let profileRows: { id: string; full_name: string | null }[] = [];
  if (userIds.length > 0) {
    const { data: rows, error: profileError } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    if (profileError) {
      console.error("global leaderboard profile error:", profileError);
    } else {
      profileRows = rows ?? [];
    }
  }

  const nameMap = new Map<string, string>();
  profileRows.forEach((row) => {
    if (row?.id && row.full_name) {
      nameMap.set(row.id, row.full_name);
    }
  });

  const statList = Array.from(stats.values());

  const topCorrect = [...statList]
    .sort((a, b) => {
      if (b.correct !== a.correct) return b.correct - a.correct;
      return b.total - a.total;
    })
    .slice(0, 20)
    .map((row, idx) => ({
      rank: idx + 1,
      userId: row.userId,
      fullName: nameMap.get(row.userId) ?? "Siswa",
      totalAnswered: row.total,
      correct: row.correct,
      accuracy:
        row.total > 0 ? Math.round((row.correct / row.total) * 100) : 0,
      isMe: row.userId === user.id,
    }));

  const mostActive = [...statList]
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return b.correct - a.correct;
    })
    .slice(0, 20)
    .map((row, idx) => ({
      rank: idx + 1,
      userId: row.userId,
      fullName: nameMap.get(row.userId) ?? "Siswa",
      totalAnswered: row.total,
      correct: row.correct,
      accuracy:
        row.total > 0 ? Math.round((row.correct / row.total) * 100) : 0,
      isMe: row.userId === user.id,
    }));

  return NextResponse.json({ ok: true, topCorrect, mostActive });
}
