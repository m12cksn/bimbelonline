// src/app/api/teacher/classes/[id]/students-quota/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type QuotaRow = {
  student_id: string;
  allowed_sessions: number;
  used_sessions: number;
  profiles:
    | {
        full_name: string | null;
        email: string | null;
      }
    | {
        full_name: string | null;
        email: string | null;
      }[];
};

export async function GET(
  _req: Request,
  {
    params,
  }: {
    params: { id: string } | Promise<{ id: string }>;
  }
) {
  const resolved =
    typeof params === "object" && "then" in params ? await params : params;

  const classId = Number(resolved.id);
  if (Number.isNaN(classId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid class id" },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();

  // 1️⃣ Auth guru
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthenticated" },
      { status: 401 }
    );
  }

  // 2️⃣ Pastikan user adalah teacher di kelas ini
  const { data: rel, error: relErr } = await supabase
    .from("class_teachers")
    .select("id")
    .eq("class_id", classId)
    .eq("teacher_id", user.id)
    .maybeSingle();

  if (relErr) {
    console.error("teacher relation error", relErr);
    return NextResponse.json(
      { ok: false, error: "Failed validate teacher" },
      { status: 500 }
    );
  }

  if (!rel) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  // 3️⃣ Ambil kuota murid + profile untuk periode yang masih aktif
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("class_student_zoom_quota")
    .select(
      `
      student_id,
      allowed_sessions,
      used_sessions,
      profiles (
        full_name,
        email
      )
    `
    )
    .eq("class_id", classId)
    .lte("period_start", nowIso)
    .gte("period_end", nowIso);

  if (error) {
    console.error("students quota fetch error", error);
    return NextResponse.json(
      { ok: false, error: "Failed fetch students quota" },
      { status: 500 }
    );
  }

  const students =
    (data as QuotaRow[] | null)?.map((row) => {
      let profile: { full_name: string | null; email: string | null } | null =
        null;

      if (Array.isArray(row.profiles)) {
        profile = row.profiles[0] ?? null;
      } else {
        profile = row.profiles ?? null;
      }

      const allowed = row.allowed_sessions ?? 0;
      const used = row.used_sessions ?? 0;

      return {
        student_id: row.student_id,
        name: profile?.full_name ?? "-",
        email: profile?.email ?? "-",
        allowed,
        used,
        remaining: Math.max(allowed - used, 0),
      };
    }) ?? [];

  return NextResponse.json({
    ok: true,
    students,
  });
}
