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
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const nowIso = new Date().toISOString();

  const { data: quota } = await supabase
    .from("class_student_zoom_quota")
    .select("allowed_sessions, used_sessions")
    .eq("class_id", classId)
    .eq("student_id", user.id)
    .lte("period_start", nowIso)
    .gte("period_end", nowIso)
    .maybeSingle();

  if (!quota) {
    return NextResponse.json({ ok: true, quota: null });
  }

  return NextResponse.json({
    ok: true,
    quota: {
      allowed: quota.allowed_sessions,
      used: quota.used_sessions,
      remaining: quota.allowed_sessions - quota.used_sessions,
    },
  });
}
