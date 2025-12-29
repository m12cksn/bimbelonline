import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type CreateMaterialPayload = {
  title?: string;
  description?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  pdfUrl?: string | null;
  tryoutDurationMinutes?: number | null;
  gradeId?: number | null;
  subjectId?: number | null;
};

export async function POST(req: Request) {
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

  const body = (await req.json()) as CreateMaterialPayload;
  const title = String(body.title ?? "").trim();

  if (!title) {
    return NextResponse.json(
      { ok: false, error: "Judul materi wajib diisi" },
      { status: 400 }
    );
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const creator = serviceKey
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : supabase;

  const { data, error } = await creator
    .from("materials")
    .insert({
      title,
      description: body.description ?? null,
      image_url: body.imageUrl ?? null,
      video_url: body.videoUrl ?? null,
      pdf_url: body.pdfUrl ?? null,
      tryout_duration_minutes: body.tryoutDurationMinutes ?? null,
      grade_id: body.gradeId ?? null,
      subject_id: body.subjectId ?? null,
    })
    .select("id, title")
    .single();

  if (error || !data) {
    console.error("Create material error:", error);
    return NextResponse.json(
      { ok: false, error: "Gagal membuat materi" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, material: data });
}
