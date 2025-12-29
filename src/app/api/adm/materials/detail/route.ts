import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(req: Request) {
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

  const url = new URL(req.url);
  const materialId = Number(url.searchParams.get("materialId"));
  if (!materialId || Number.isNaN(materialId)) {
    return NextResponse.json(
      { ok: false, error: "Material id tidak valid" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("materials")
    .select(
      "id, title, description, image_url, video_url, pdf_url, tryout_duration_minutes, grade_id, subject_id"
    )
    .eq("id", materialId)
    .single();

  if (error || !data) {
    console.error("materials detail error:", error);
    return NextResponse.json(
      { ok: false, error: "Gagal memuat detail materi" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, material: data });
}
