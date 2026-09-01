import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { diagnosticServiceClient, seedDiagnosticQuestions } from "@/lib/diagnosticQuestionStore";

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

export async function POST() {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: admin.error }, { status: admin.status });

  const supabase = diagnosticServiceClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Konfigurasi Supabase belum lengkap." }, { status: 500 });

  const { error } = await seedDiagnosticQuestions(supabase);
  if (error) {
    console.error("diagnostic seed all error", error);
    return NextResponse.json(
      { ok: false, error: "Gagal sinkron soal default. Pastikan migrasi database sudah dijalankan." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
