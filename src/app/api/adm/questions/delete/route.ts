import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

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

  const body = (await req.json()) as { questionId?: string };
  const questionId = body.questionId;
  if (!questionId) {
    return NextResponse.json(
      { ok: false, error: "ID soal tidak valid" },
      { status: 400 }
    );
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const deleter = serviceKey
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : supabase;

  const { error } = await deleter.from("questions").delete().eq("id", questionId);

  if (error) {
    console.error("Delete question error:", error);
    return NextResponse.json(
      { ok: false, error: "Gagal menghapus soal" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
