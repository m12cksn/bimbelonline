import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const resolved =
    typeof params === "object" && "then" in params ? await params : params;

  const classId = Number(resolved.id);
  if (Number.isNaN(classId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  // auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  // cek teacher memang di kelas ini
  const { data: rel } = await supabase
    .from("class_teachers")
    .select("id")
    .eq("class_id", classId)
    .eq("teacher_id", user.id)
    .maybeSingle();

  if (!rel) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("class_zoom_sessions")
    .select("id, title, start_time, end_time")
    .eq("class_id", classId)
    .order("start_time", { ascending: true });

  if (error) {
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sessions: data ?? [] });
}
