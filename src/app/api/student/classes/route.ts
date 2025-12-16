import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET() {
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

  // 1️⃣ ambil relasi student → class_id
  const { data: relations, error: relErr } = await supabase
    .from("class_students")
    .select("class_id")
    .eq("student_id", user.id);

  if (relErr) {
    console.error("class_students error", relErr);
    return NextResponse.json(
      { ok: false, error: "Failed fetch class relations" },
      { status: 500 }
    );
  }

  if (!relations || relations.length === 0) {
    return NextResponse.json({ ok: true, classes: [] });
  }

  const classIds = relations.map((r) => r.class_id);

  // 2️⃣ ambil data classes
  const { data: classes, error: classErr } = await supabase
    .from("classes")
    .select("id, name")
    .in("id", classIds);

  if (classErr) {
    console.error("classes error", classErr);
    return NextResponse.json(
      { ok: false, error: "Failed fetch classes" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    classes: classes ?? [],
  });
}
