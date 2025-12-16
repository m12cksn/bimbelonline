// src/app/api/adm/classes/[id]/teachers/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type RawRow = Record<string, unknown>;

/** type-guard: apakah value punya properti 'code' (mis. PostgrestError) */
function hasCodeProp(v: unknown): v is { code?: unknown } {
  return typeof v === "object" && v !== null && "code" in v;
}

function getString(
  row: RawRow | null | undefined,
  key: string,
  fallback = ""
): string {
  if (!row || typeof row !== "object") return fallback;
  const v = row[key];
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return fallback;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolved =
      typeof params === "object" && "then" in params ? await params : params;
    const classId = Number(resolved?.id);
    if (Number.isNaN(classId))
      return NextResponse.json(
        { ok: false, error: "Invalid class id" },
        { status: 400 }
      );

    const rawBody: unknown = await req.json().catch(() => ({}));
    let teacher_id: string | null = null;
    if (rawBody && typeof rawBody === "object") {
      const b = rawBody as Record<string, unknown>;
      if (typeof b["teacher_id"] === "string") teacher_id = b["teacher_id"];
    }
    if (!teacher_id)
      return NextResponse.json(
        { ok: false, error: "teacher_id required" },
        { status: 400 }
      );

    const supabase = await createSupabaseServerClient();

    // auth + admin check
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user ?? null;
    if (!user)
      return NextResponse.json(
        { ok: false, error: "Unauthenticated" },
        { status: 401 }
      );

    const { data: profileData, error: profileErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileErr || !profileData)
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    const role = getString(profileData as RawRow, "role", "");
    if (role !== "admin")
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );

    const { data, error } = await supabase
      .from("class_teachers")
      .insert({ class_id: classId, teacher_id })
      .select()
      .single();

    if (error) {
      console.error("add teacher error", error);
      // gunakan type guard untuk memeriksa kode error Postgres
      let code = "";
      if (hasCodeProp(error) && typeof error.code === "string")
        code = error.code;

      if (code === "23505") {
        return NextResponse.json(
          { ok: false, error: "Teacher already assigned" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { ok: false, error: "Failed to add teacher" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, teacher: data });
  } catch (err) {
    console.error("POST /api/adm/classes/[id]/teachers error", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
