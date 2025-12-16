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
    // 🔒 SUDAH HADIR
    if (error.code === "23505") {
      return NextResponse.json({
        ok: true,
        alreadyPresent: true,
      });
    }

    console.error("attendance error", error);
    return NextResponse.json(
      { ok: false, error: "Gagal mencatat kehadiran" },
      { status: 500 }
    );
  }

  /* =========================
     UPDATE QUOTA (AMAN)
  ========================= */

  await supabase.rpc("increment_zoom_quota", {
    p_zoom_id: zoomId,
    p_student_id: user.id,
  });

  return NextResponse.json({ ok: true });
}
