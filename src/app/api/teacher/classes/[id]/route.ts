import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type Raw = Record<string, unknown>;

function getString(o: Raw | null | undefined, k: string): string {
  if (!o) return "";
  const v = o[k];
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return "";
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolved =
      typeof params === "object" && "then" in params ? await params : params;

    const classId = Number(resolved.id);
    if (Number.isNaN(classId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid class id" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // auth
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user ?? null;
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    // validasi: teacher memang pegang kelas ini
    const { data: ct } = await supabase
      .from("class_teachers")
      .select("id")
      .eq("class_id", classId)
      .eq("teacher_id", user.id)
      .maybeSingle();

    if (!ct) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // ambil info kelas
    const { data: classData } = await supabase
      .from("classes")
      .select("id, name, subject, grade, description")
      .eq("id", classId)
      .single();

    // ambil student di kelas
    const { data: studentsRaw } = await supabase
      .from("class_students")
      .select(
        `
        student_id,
        profiles:profiles!student_id (
          id,
          full_name,
          email
        )
      `
      )
      .eq("class_id", classId);

    const students = (studentsRaw ?? []).map((row) => {
      const r = row as Raw;
      const pRaw = r["profiles"];
      const p =
        Array.isArray(pRaw) && pRaw.length > 0
          ? (pRaw[0] as Raw)
          : (pRaw as Raw | null);

      return {
        id: String(r["student_id"]),
        name:
          getString(p, "full_name") ||
          getString(p, "email") ||
          String(r["student_id"]),
        email: getString(p, "email"),
      };
    });

    return NextResponse.json({
      ok: true,
      class: classData,
      students,
    });
  } catch (err) {
    console.error("GET teacher class detail error", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
