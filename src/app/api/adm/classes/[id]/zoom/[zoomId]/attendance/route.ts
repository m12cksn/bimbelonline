import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

/* =========================
   TYPES
========================= */

type AttendanceRow = {
  student_id: string;
  is_present: boolean;
  checked_at: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type QuotaRow = {
  student_id: string;
  allowed_sessions: number;
  used_sessions: number;
};

/* =========================
   GET ATTENDANCE DETAIL
========================= */

export async function GET(
  _req: Request,
  {
    params,
  }: {
    params:
      | { id: string; zoomId: string }
      | Promise<{ id: string; zoomId: string }>;
  }
) {
  const resolved =
    typeof params === "object" && "then" in params ? await params : params;

  const classId = Number(resolved.id);
  const zoomId = Number(resolved.zoomId);

  if (Number.isNaN(classId) || Number.isNaN(zoomId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid id" },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();

  /* =========================
     AUTH ADMIN
  ========================= */

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminProfile?.role !== "admin") {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  /* =========================
     VALIDATE ZOOM SESSION
  ========================= */

  const { data: zoom, error: zoomErr } = await supabase
    .from("class_zoom_sessions")
    .select("id, class_id")
    .eq("id", zoomId)
    .single();

  if (zoomErr || !zoom || zoom.class_id !== classId) {
    return NextResponse.json(
      { ok: false, error: "Zoom session tidak valid untuk class ini" },
      { status: 404 }
    );
  }

  /* =========================
     1️⃣ FETCH ATTENDANCE
  ========================= */

  const { data: attendance, error: attErr } = await supabase
    .from("class_zoom_attendance")
    .select("student_id, is_present, checked_at")
    .eq("zoom_id", zoomId);

  if (attErr) {
    console.error("attendance fetch error", attErr);
    return NextResponse.json(
      { ok: false, error: "Failed fetch attendance" },
      { status: 500 }
    );
  }

  const attendanceRows = (attendance ?? []) as AttendanceRow[];

  /* =========================
     2️⃣ FETCH PROFILES
  ========================= */

  const studentIds = attendanceRows.map((a) => a.student_id);

  const { data: profiles, error: profileErr } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", studentIds);

  if (profileErr) {
    console.error("profiles fetch error", profileErr);
    return NextResponse.json(
      { ok: false, error: "Failed fetch profiles" },
      { status: 500 }
    );
  }

  const profileMap = new Map<string, ProfileRow>();
  (profiles ?? []).forEach((p) => profileMap.set(p.id, p));

  /* =========================
     3️⃣ FETCH QUOTA
  ========================= */

  const { data: quotas, error: quotaErr } = await supabase
    .from("class_student_zoom_quota")
    .select("student_id, allowed_sessions, used_sessions")
    .eq("class_id", classId);

  if (quotaErr) {
    console.error("quota fetch error", quotaErr);
    return NextResponse.json(
      { ok: false, error: "Failed fetch quota" },
      { status: 500 }
    );
  }

  const quotaMap = new Map<string, QuotaRow>();
  (quotas ?? []).forEach((q) => quotaMap.set(q.student_id, q));

  /* =========================
     4️⃣ MERGE RESULT
  ========================= */

  const students = attendanceRows.map((row) => {
    const profile = profileMap.get(row.student_id) ?? null;
    const quota = quotaMap.get(row.student_id) ?? null;

    return {
      student_id: row.student_id,
      name: profile?.full_name ?? "-",
      email: profile?.email ?? "-",
      present: row.is_present,
      checked_at: row.checked_at,
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
