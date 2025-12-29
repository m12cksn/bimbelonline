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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("materials")
    .select("id, title")
    .order("id", { ascending: true });

  if (error) {
    console.error("materials list error:", error);
    return NextResponse.json(
      { ok: false, error: "Gagal memuat materi" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, materials: data ?? [] });
}
