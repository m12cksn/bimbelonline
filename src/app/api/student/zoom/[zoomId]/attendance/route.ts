import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(
  _req: Request,
  { params }: { params: { zoomId: string } | Promise<{ zoomId: string }> }
) {
  const resolved =
    typeof params === "object" && "then" in params ? await params : params;

  const zoomId = Number(resolved.zoomId);
  if (Number.isNaN(zoomId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid zoom id" },
      { status: 400 }
    );
  }

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

  /* =========================
     INSERT ATTENDANCE
  ========================= */

  const { error } = await supabase.from("class_zoom_attendance").insert({
    zoom_id: zoomId,
    student_id: user.id,
    is_present: true,
    checked_at: new Date().toISOString(),
  });

  if (error) {
    // ?? SUDAH HADIR
    if (error.code !== "23505") {
      console.error("attendance error", error);
      return NextResponse.json(
        { ok: false, error: "Gagal mencatat kehadiran" },
        { status: 500 }
      );
    }
  }

/* =========================
     UPDATE QUOTA (AMAN)
  ========================= */

  const { data: attendanceRow, error: attendanceErr } = await supabase
    .from("class_zoom_attendance")
    .select("id, quota_used")
    .eq("zoom_id", zoomId)
    .eq("student_id", user.id)
    .single();

  if (attendanceErr) {
    console.error("fetch attendance error:", attendanceErr);
  } else if (attendanceRow?.quota_used) {
    return NextResponse.json({ ok: true, alreadyPresent: true });
  }

  const { data: zoomRow, error: zoomErr } = await supabase
    .from("class_zoom_sessions")
    .select("class_id")
    .eq("id", zoomId)
    .single();

  if (zoomErr) {
    console.error("fetch zoom session error:", zoomErr);
    return NextResponse.json({ ok: true });
  }

  const classId = zoomRow?.class_id;
  if (!classId) {
    return NextResponse.json({ ok: true });
  }

  const { data: quotaRow, error: quotaErr } = await supabase
    .from("class_student_zoom_quota")
    .select("id, used_sessions")
    .eq("class_id", classId)
    .eq("student_id", user.id)
    .order("period_end", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: number; used_sessions: number }>();

  if (quotaErr) {
    console.error("fetch quota error:", quotaErr);
    return NextResponse.json({ ok: true });
  }

  if (quotaRow?.id) {
    const { error: updateErr } = await supabase
      .from("class_student_zoom_quota")
      .update({ used_sessions: (quotaRow.used_sessions ?? 0) + 1 })
      .eq("id", quotaRow.id);

    if (updateErr) {
      console.error("update quota error:", updateErr);
    }

    if (attendanceRow?.id) {
      const { error: markErr } = await supabase
        .from("class_zoom_attendance")
        .update({ quota_used: true })
        .eq("id", attendanceRow.id);

      if (markErr) {
        console.error("mark attendance quota_used error:", markErr);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
