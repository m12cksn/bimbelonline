import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { diagnosticServiceClient } from "@/lib/diagnosticQuestionStore";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "Unauthenticated" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return { ok: false as const, status: 403, error: "Forbidden" };
  return { ok: true as const };
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: admin.error }, { status: admin.status });

  const body = (await req.json()) as { id?: string };
  const id = String(body.id ?? "").trim();
  if (!id) return NextResponse.json({ ok: false, error: "ID soal tidak valid." }, { status: 400 });

  const supabase = diagnosticServiceClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Konfigurasi Supabase belum lengkap." }, { status: 500 });

  const { error } = await supabase.from("diagnostic_questions").delete().eq("id", id);
  if (error) {
    console.error("diagnostic question delete error", error);
    return NextResponse.json({ ok: false, error: "Gagal menghapus soal diagnostic." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
