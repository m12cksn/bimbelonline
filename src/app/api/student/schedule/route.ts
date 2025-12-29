import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });
  }

  const { data: classLinks } = await supabase
    .from("class_students")
    .select("class_id")
    .eq("student_id", user.id);

  const classIds = Array.isArray(classLinks)
    ? classLinks.map((row) => (row as { class_id: number }).class_id)
    : [];

  if (classIds.length === 0) {
    return NextResponse.json({ ok: true, items: [] });
  }

  const now = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 7);

  const { data, error } = await supabase
    .from("class_zoom_sessions")
    .select("id, class_id, title, start_time, end_time, classes ( name )")
    .in("class_id", classIds)
    .gte("start_time", now.toISOString())
    .lte("start_time", end.toISOString())
    .order("start_time", { ascending: true });

  if (error) {
    console.error("schedule error:", error);
    return NextResponse.json(
      { ok: false, error: "Gagal memuat jadwal belajar" },
      { status: 500 }
    );
  }

  const items = (data ?? []).map((row) => {
    const raw = row as Record<string, unknown>;
    const classValue = raw.classes;
    const classObj = Array.isArray(classValue)
      ? (classValue[0] as Record<string, unknown> | undefined) ?? null
      : (classValue as Record<string, unknown> | null);

    return {
      id: raw.id,
      title: typeof raw.title === "string" ? raw.title : "Sesi Zoom",
      startTime: raw.start_time,
      endTime: raw.end_time,
      classId: raw.class_id,
      className: typeof classObj?.name === "string" ? classObj.name : null,
    };
  });

  return NextResponse.json({ ok: true, items });
}
