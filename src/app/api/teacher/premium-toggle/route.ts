// app/api/teacher/premium-toggle/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: Request) {
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
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // ignore
          }
        },
      },
    }
  );

  // 1. cek user login
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // 2. cek role: hanya teacher/admin yang boleh
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 403 });
  }

  if (profile.role !== "teacher" && profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 3. baca body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { studentId, isPremium } = body as {
    studentId?: string;
    isPremium?: boolean;
  };

  if (!studentId || typeof studentId !== "string") {
    return NextResponse.json(
      { error: "studentId is required" },
      { status: 400 }
    );
  }

  if (typeof isPremium !== "boolean") {
    return NextResponse.json(
      { error: "isPremium must be boolean" },
      { status: 400 }
    );
  }

  // 4. update profile murid
  const { data: updatedRow, error: updateError } = await supabase
    .from("profiles")
    .update({ is_premium: isPremium })
    .eq("id", studentId)
    .eq("role", "student")
    .select("id, full_name, is_premium")
    .maybeSingle();

  if (updateError) {
    console.error("Update is_premium error:", updateError);
    return NextResponse.json(
      { error: "Failed to update premium status" },
      { status: 500 }
    );
  }

  if (!updatedRow) {
    return NextResponse.json(
      { error: "Student not found or access denied" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    studentId: updatedRow.id,
    full_name: updatedRow.full_name,
    is_premium: updatedRow.is_premium,
  });
}
