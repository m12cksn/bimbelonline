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

/* =========================
   GET TEACHER ATTENDANCE
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
     AUTH TEACHER
  ========================= */

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  // validasi teacher mengajar kelas ini
  const { data: rel } = await supabase
    .from("class_teachers")
    .select("id")
    .eq("class_id", classId)
    .eq("teacher_id", user.id)
    .maybeSingle();

  if (!rel) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  /* =========================
     VALIDATE ZOOM SESSION
  ========================= */

  const { data: zoom } = await supabase
    .from("class_zoom_sessions")
    .select("id, class_id")
    .eq("id", zoomId)
    .single();

  if (!zoom || zoom.class_id !== classId) {
    return NextResponse.json(
      { ok: false, error: "Zoom tidak valid" },
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
    console.error("attendance error", attErr);
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
    console.error("profiles error", profileErr);
    return NextResponse.json(
      { ok: false, error: "Failed fetch profiles" },
      { status: 500 }
    );
  }

  const profileMap = new Map<string, ProfileRow>();
  (profiles ?? []).forEach((p) => profileMap.set(p.id, p));

  /* =========================
     3️⃣ MERGE RESULT
  ========================= */

  const students = attendanceRows.map((row) => {
    const profile = profileMap.get(row.student_id);

    return {
      student_id: row.student_id,
      name: profile?.full_name ?? "-",
      email: profile?.email ?? "-",
      present: row.is_present,
      checked_at: row.checked_at,
    };
  });

  return NextResponse.json({
    ok: true,
    students,
  });
}
