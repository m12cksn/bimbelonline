import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type DeletePayload = {
  id?: number;
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

  const body = (await req.json()) as DeletePayload;
  const id = Number(body.id);

  if (!id || Number.isNaN(id)) {
    return NextResponse.json(
      { ok: false, error: "Material id tidak valid" },
      { status: 400 }
    );
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const deleter = serviceKey
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : supabase;

  const deleteSteps = [
    deleter.from("question_attempts").delete().eq("material_id", id),
    deleter.from("material_attempts").delete().eq("material_id", id),
    deleter.from("material_tryout_attempts").delete().eq("material_id", id),
    deleter.from("student_material_progress").delete().eq("material_id", id),
    deleter.from("questions").delete().eq("material_id", id),
    deleter.from("materials").delete().eq("id", id),
  ];

  const results = await Promise.all(deleteSteps);
  const firstError = results.find((res) => res.error)?.error ?? null;

  if (firstError) {
    console.error("delete material error:", firstError);
    return NextResponse.json(
      { ok: false, error: "Gagal menghapus materi" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
