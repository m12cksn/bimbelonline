// src/app/api/adm/classes/[id]/teachers/[teacherId]/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type RawRow = Record<string, unknown>;
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

export async function DELETE(
  _req: Request,
  {
    params,
  }: {
    params:
      | { id: string; teacherId: string }
      | Promise<{ id: string; teacherId: string }>;
  }
) {
  try {
    const resolved =
      typeof params === "object" && "then" in params ? await params : params;
    const classId = Number(resolved?.id);
    const teacherId = String(resolved?.teacherId ?? "");
    if (Number.isNaN(classId) || teacherId === "")
      return NextResponse.json(
        { ok: false, error: "Invalid params" },
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

    const { error } = await supabase
      .from("class_teachers")
      .delete()
      .eq("class_id", classId)
      .eq("teacher_id", teacherId);

    if (error) {
      console.error("delete teacher error", error);
      return NextResponse.json(
        { ok: false, error: "Failed to remove teacher" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(
      "DELETE /api/adm/classes/[id]/teachers/[teacherId] error",
      err
    );
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
