// app/api/student/upcoming-zoom/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type ZoomSessionRow = {
  id: number;
  class_id: number;
  zoom_link: string | null;
  start_time: string;
  end_time: string | null;
  // Supabase bisa balikin array atau null tergantung relasi
  classes?: { name: string }[] | null;
};

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthenticated" });
    }

    // 1) ambil semua class_id yang diikuti student
    const { data: classLinks, error: classErr } = await supabase
      .from("class_students")
      .select("class_id")
      .eq("student_id", user.id);

    if (classErr) {
      console.error("class_students error:", classErr);
      return NextResponse.json({ ok: true, sessions: [] });
    }

    if (!classLinks || classLinks.length === 0) {
      return NextResponse.json({ ok: true, sessions: [] });
    }

    const classIds = classLinks.map((c) => c.class_id);
    const nowIso = new Date().toISOString();

    // 2) ambil jadwal zoom terdekat untuk kelas-kelas tersebut
    const { data, error: zoomErr } = await supabase
      .from("class_zoom_sessions")
      .select(
        `
          id,
          class_id,
          zoom_link,
          start_time,
          end_time,
          classes ( name )
        `
      )
      .in("class_id", classIds)
      .gte("start_time", nowIso)
      .order("start_time", { ascending: true })
      .limit(3);

    if (zoomErr) {
      console.error("class_zoom_sessions error:", zoomErr);
      return NextResponse.json({ ok: true, sessions: [] });
    }

    const sessions = (data ?? []) as ZoomSessionRow[];

    const mapped = sessions.map((s) => {
      // classes bisa array, jadi ambil yang pertama
      const firstClass = Array.isArray(s.classes) ? s.classes[0] : null;
      const className = firstClass?.name ?? `Kelas #${s.class_id ?? "?"}`;

      return {
        id: s.id,
        classId: s.class_id,
        className,
        startTime: s.start_time,
        endTime: s.end_time,
        zoomUrl: s.zoom_link,
      };
    });

    return NextResponse.json({ ok: true, sessions: mapped });
  } catch (err) {
    console.error("upcoming-zoom GET error:", err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
