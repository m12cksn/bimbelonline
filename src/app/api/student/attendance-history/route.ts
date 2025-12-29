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

  const { data, error } = await supabase
    .from("class_zoom_attendance")
    .select(
      "id, zoom_id, checked_at, class_zoom_sessions ( title, start_time, class_id, classes ( name ) )"
    )
    .eq("student_id", user.id)
    .order("checked_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("attendance history error:", error);
    return NextResponse.json(
      { ok: false, error: "Gagal memuat riwayat kehadiran" },
      { status: 500 }
    );
  }

  const items = (data ?? []).map((row) => {
    const raw = row as Record<string, unknown>;
    const zoomValue = raw.class_zoom_sessions;
    const zoomObj = Array.isArray(zoomValue)
      ? (zoomValue[0] as Record<string, unknown> | undefined) ?? null
      : (zoomValue as Record<string, unknown> | null);
    const classValue = zoomObj?.classes;
    const classObj = Array.isArray(classValue)
      ? (classValue[0] as Record<string, unknown> | undefined) ?? null
      : (classValue as Record<string, unknown> | null);

    return {
      id: raw.id,
      checkedAt: raw.checked_at,
      zoomTitle: typeof zoomObj?.title === "string" ? zoomObj.title : null,
      zoomStart: zoomObj?.start_time ?? null,
      classId: zoomObj?.class_id ?? null,
      className: typeof classObj?.name === "string" ? classObj.name : null,
    };
  });

  return NextResponse.json({ ok: true, items });
}
