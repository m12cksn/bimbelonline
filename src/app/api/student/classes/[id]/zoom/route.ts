import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
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

    // auth
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    const nowIso = new Date().toISOString();
    const activePeriodOr =
      `and(start_date.lte.${nowIso},end_date.gte.${nowIso}),` +
      `and(start_date.is.null,end_date.is.null),` +
      `and(start_date.is.null,end_date.gte.${nowIso}),` +
      `and(start_date.lte.${nowIso},end_date.is.null)`;

    // validasi student terdaftar di kelas & periode masih aktif
    const { data: cs } = await supabase
      .from("class_students")
      .select("id")
      .eq("class_id", classId)
      .eq("student_id", user.id)
      .or(activePeriodOr)
      .maybeSingle();

    if (!cs) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // ambil jadwal zoom
    const { data: zoomSessions, error } = await supabase
      .from("class_zoom_sessions")
      .select("id, title, start_time, end_time, zoom_link")
      .eq("class_id", classId)
      .order("start_time", { ascending: true });

    if (error) {
      console.error("student zoom error", error);
      return NextResponse.json(
        { ok: false, error: "Failed fetch zoom" },
        { status: 500 }
      );
    }

    // 🔥 ambil attendance student
    const { data: attendance } = await supabase
      .from("class_zoom_attendance")
      .select("zoom_id")
      .eq("student_id", user.id);

    const attendedZoomIds = new Set((attendance ?? []).map((a) => a.zoom_id));

    // 🔥 gabungkan status hadir
    const sessions = (zoomSessions ?? []).map((z) => ({
      ...z,
      already_present: attendedZoomIds.has(z.id),
    }));

    return NextResponse.json({
      ok: true,
      sessions,
    });
  } catch (err) {
    console.error("GET student zoom fatal", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
