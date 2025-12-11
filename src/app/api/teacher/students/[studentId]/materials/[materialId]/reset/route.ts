import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

interface Params {
  params: Promise<{
    studentId: string;
    materialId: string;
  }>;
}

export async function DELETE(req: Request, props: Params) {
  const { studentId, materialId: materialIdStr } = await props.params;
  const materialId = Number(materialIdStr);

  if (!studentId || Number.isNaN(materialId)) {
    return NextResponse.json(
      { error: "Invalid studentId or materialId" },
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
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  // 1️⃣ cek login
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // 2️⃣ cek role = teacher / admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "teacher" && profile.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 3️⃣ hapus attempts
  const { error: deleteAttemptsError } = await supabase
    .from("question_attempts")
    .delete()
    .eq("user_id", studentId)
    .eq("material_id", materialId);

  if (deleteAttemptsError) {
    console.error(deleteAttemptsError);
    return NextResponse.json(
      { error: "Failed to delete attempts" },
      { status: 500 }
    );
  }

  // 4️⃣ hapus progress
  const { error: deleteProgressError } = await supabase
    .from("student_material_progress")
    .delete()
    .eq("user_id", studentId)
    .eq("material_id", materialId);

  if (deleteProgressError) {
    console.error(deleteProgressError);
    return NextResponse.json(
      { error: "Failed to delete progress" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    studentId,
    materialId,
  });
}
