// app/api/teacher/notes/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const studentId = url.searchParams.get("studentId");
  const materialId = url.searchParams.get("materialId");

  if (!studentId || !materialId) {
    return NextResponse.json(
      { error: "studentId & materialId required" },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  // 🔐 auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "teacher" && profile.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 🎯 FIX: embed relasi guru memakai fkey spesifik
  const { data, error } = await supabase
    .from("teacher_notes")
    .select(
      `
      id,
      content,
      created_by,
      created_at,
      updated_at,
      teacher:profiles!teacher_notes_created_by_fkey (
        id,
        full_name
      )
    `
    )
    .eq("student_id", studentId)
    .eq("material_id", materialId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Fetch notes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}
