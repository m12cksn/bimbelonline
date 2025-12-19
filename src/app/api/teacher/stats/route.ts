// src/app/api/teacher/stats/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user ?? null;
    if (!user)
      return NextResponse.json(
        { ok: false, error: "Unauthenticated" },
        { status: 401 }
      );

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      profileError ||
      !profile ||
      (profile.role !== "teacher" && profile.role !== "admin")
    ) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // ambil kelas teacher
    const { data: classRows } = await supabase
      .from("class_teachers")
      .select("class_id")
      .eq("teacher_id", user.id);

    const classIds = (classRows ?? []).map((r) => r.class_id);

    let totalStudents = 0;
    if (classIds.length > 0) {
      const { count } = await supabase
        .from("class_students")
        .select("*", { count: "exact", head: true })
        .in("class_id", classIds);

      totalStudents = count ?? 0;
    }

    return NextResponse.json({
      ok: true,
      classes: classIds.length,
      students: totalStudents,
    });
  } catch (err) {
    console.error("teacher stats error", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
