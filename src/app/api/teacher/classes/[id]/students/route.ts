// src/app/api/teacher/classes/[id]/students/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type StudentRowRaw = {
  student_id: string;
  profiles:
    | {
        full_name: string | null;
        email: string | null;
      }[]
    | {
        full_name: string | null;
        email: string | null;
      }
    | null;
};

type QuotaRow = {
  student_id: string;
  allowed_sessions: number;
  used_sessions: number;
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

  // 1️⃣ Auth teacher
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthenticated" },
      { status: 401 }
    );
  }

  // Pastikan user ini adalah TEACHER di class ini
  const { data: rel, error: relErr } = await supabase
    .from("class_teachers")
    .select("id")
    .eq("class_id", classId)
    .eq("teacher_id", user.id)
    .maybeSingle();

  if (relErr) {
    console.error("teacher rel error", relErr);
    return NextResponse.json(
      { ok: false, error: "Failed to check teacher relation" },
      { status: 500 }
    );
  }

  if (!rel) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  // 2️⃣ Ambil murid di kelas + profil
  const { data: studentsRaw, error: studentsErr } = await supabase
    .from("class_students")
    .select(
      `
      student_id,
      profiles:profiles!class_students_student_id_fkey(
        full_name,
        email
      )
    `
    )
    .eq("class_id", classId);

  if (studentsErr) {
    console.error("students fetch error", studentsErr);
    return NextResponse.json(
      { ok: false, error: "Failed fetch students" },
      { status: 500 }
    );
  }

  const studentsRows = (studentsRaw ?? []) as StudentRowRaw[];

  // 3️⃣ Ambil kuota zoom aktif untuk class ini
  const nowIso = new Date().toISOString();

  const { data: quotas, error: quotaErr } = await supabase
    .from("class_student_zoom_quota")
    .select(
      "student_id, allowed_sessions, used_sessions, period_start, period_end"
    )
    .eq("class_id", classId)
    .lte("period_start", nowIso)
    .gte("period_end", nowIso);

  if (quotaErr) {
    console.error("quota fetch error", quotaErr);
    return NextResponse.json(
      { ok: false, error: "Failed fetch quota" },
      { status: 500 }
    );
  }

  const quotaMap = new Map<string, QuotaRow>();
  (quotas ?? []).forEach((q) => {
    quotaMap.set(q.student_id, q);
  });

  // 4️⃣ Gabungkan murid + profil + kuota
  const students = studentsRows.map((row) => {
    let profile: {
      full_name: string | null;
      email: string | null;
    } | null = null;

    if (Array.isArray(row.profiles)) {
      profile = row.profiles[0] ?? null;
    } else if (row.profiles) {
      profile = row.profiles;
    }

    const quota = quotaMap.get(row.student_id) ?? null;

    return {
      student_id: row.student_id,
      name: profile?.full_name ?? "-",
      email: profile?.email ?? "-",
      quota: quota
        ? {
            allowed: quota.allowed_sessions,
            used: quota.used_sessions,
            remaining: quota.allowed_sessions - quota.used_sessions,
          }
        : null,
    };
  });

  return NextResponse.json({
    ok: true,
    students,
  });
}
