// src/app/api/adm/classes/route.ts
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

function makeClassName(subject: string, grade?: number) {
  const shortId = randomBytes(3).toString("hex");
  const gradeText = grade ? `K${grade}` : "K?";
  return `${subject} • ${gradeText} • ${shortId}`;
}
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // jika kamu ingin hanya menampilkan kelas publik atau semua kelas,
    // ubah query sesuai kebutuhan (mis. where is_active = true)
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("GET /api/adm/classes error:", error);
      return NextResponse.json(
        { classes: [], error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ classes: data ?? [] });
  } catch (err) {
    console.error("GET /api/adm/classes unexpected error:", err);
    return NextResponse.json(
      { classes: [], error: "internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { subject, grade, description } = body;
    if (!subject)
      return NextResponse.json(
        { ok: false, error: "subject required" },
        { status: 400 }
      );

    const supabase = await createSupabaseServerClient();

    // ambil user
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user ?? null;
    if (!user)
      return NextResponse.json(
        { ok: false, error: "Unauthenticated" },
        { status: 401 }
      );

    // cek role admin
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile || profile.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const name = makeClassName(subject, grade);

    const { data, error } = await supabase
      .from("classes")
      .insert({ name, subject, grade, description })
      .select()
      .single();

    if (error) {
      console.error("create class error", error);
      return NextResponse.json(
        { ok: false, error: "Failed to create class" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, class: data });
  } catch (err) {
    console.error("POST /api/adm/classes error", err);
    return NextResponse.json(
      { ok: false, error: "internal server error" },
      { status: 500 }
    );
  }
}
