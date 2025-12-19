import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(
  _req: Request,
  { params }: { params: { zoomId: string } | Promise<{ zoomId: string }> }
) {
  try {
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

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    // 1) ambil zoom session + class_id + zoom_link (server only)
    const { data: zoom, error: zoomErr } = await supabase
      .from("class_zoom_sessions")
      .select("id, class_id, start_time, end_time, zoom_link")
      .eq("id", zoomId)
      .single();

    if (zoomErr || !zoom) {
      return NextResponse.json(
        { ok: false, error: "Zoom session not found" },
        { status: 404 }
      );
    }

    // 2) validasi student terdaftar di class
    const { data: cs } = await supabase
      .from("class_students")
      .select("id")
      .eq("class_id", zoom.class_id)
      .eq("student_id", user.id)
      .maybeSingle();

    if (!cs) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // 3) cek kuota periode aktif
    const nowIso = new Date().toISOString();

    const { data: quota } = await supabase
      .from("class_student_zoom_quota")
      .select("allowed_sessions, used_sessions")
      .eq("class_id", zoom.class_id)
      .eq("student_id", user.id)
      .lte("period_start", nowIso)
      .gte("period_end", nowIso)
      .maybeSingle();

    const remaining = quota ? quota.allowed_sessions - quota.used_sessions : 0;

    if (remaining <= 0) {
      return NextResponse.json(
        { ok: false, error: "Kuota zoom habis" },
        { status: 403 }
      );
    }

    // (opsional) kalau mau lock hanya saat jadwal sedang berlangsung:
    // const now = Date.now();
    // if (now < new Date(zoom.start_time).getTime()) return NextResponse.json({ ok:false, error:"Belum mulai" }, { status: 403 });

    return NextResponse.json({ ok: true, zoom_link: zoom.zoom_link });
  } catch (err) {
    console.error("join zoom fatal", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
