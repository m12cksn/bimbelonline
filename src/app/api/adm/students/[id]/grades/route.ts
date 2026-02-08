import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type Payload = {
  gradeIds?: number[];
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY belum diset" },
      { status: 500 }
    );
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.warn("profiles fetch error", profileError);
  }

  const role =
    profile?.role ||
    (user.user_metadata?.role as string | undefined) ||
    ((user as any)?.app_metadata?.role as string | undefined);

  if (role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const body = (await req.json()) as Payload;
  const gradeIds = Array.isArray(body.gradeIds)
    ? body.gradeIds.filter((g) => typeof g === "number" && Number.isFinite(g))
    : [];

  if (gradeIds.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Minimal satu grade wajib dipilih" },
      { status: 400 }
    );
  }

  const { error: deleteError } = await adminClient
    .from("student_grades")
    .delete()
    .eq("student_id", id);

  if (deleteError) {
    return NextResponse.json(
      { ok: false, error: "Gagal menghapus grade lama" },
      { status: 500 }
    );
  }

  const rows = gradeIds.map((gradeId) => ({
    student_id: id,
    grade_id: gradeId,
  }));

  const { error: insertError } = await adminClient
    .from("student_grades")
    .insert(rows);

  if (insertError) {
    return NextResponse.json(
      { ok: false, error: "Gagal menyimpan grade" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
