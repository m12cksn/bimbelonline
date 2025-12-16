// src/app/api/adm/classes/[id]/students-list/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type RawRow = Record<string, unknown>;

function getString(
  rec: RawRow | null | undefined,
  keys: string[]
): string | null {
  if (!rec || typeof rec !== "object") return null;
  for (const k of keys) {
    const v = rec[k];
    if (typeof v === "string" && v.trim() !== "") return v;
    if (typeof v === "number") return String(v);
  }
  return null;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolved =
      typeof params === "object" && "then" in params ? await params : params;
    const classId = Number(resolved?.id);

    if (Number.isNaN(classId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid class id" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // auth check (optional)
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json(
        { ok: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    // Ambil class_students + relasi profiles (ambil semua kolom relasi supaya toleran terhadap schema)
    const { data: studentsRaw, error: studentsErr } = await supabase
      .from("class_students")
      .select(
        `
        id,
        class_id,
        student_id,
        added_at,
        start_date,
        end_date,
        profiles:profiles!student_id (*)
      `
      )
      .eq("class_id", classId)
      .order("added_at", { ascending: false });

    if (studentsErr) {
      console.error("fetch class_students error", studentsErr);
      return NextResponse.json(
        { ok: false, error: "Failed to fetch students" },
        { status: 500 }
      );
    }

    const rows = (studentsRaw ?? []) as RawRow[];

    // Normalisasi profile/email dari relasi profiles (jika relasi berupa array ambil index 0)
    const profiles = rows.map((row) => {
      const rawProfiles = row["profiles"] ?? null;
      const prof =
        Array.isArray(rawProfiles) && rawProfiles.length > 0
          ? (rawProfiles[0] as RawRow)
          : (rawProfiles as RawRow | null);

      const id = String(row["student_id"] ?? "");
      const full_name =
        getString(prof, ["full_name", "name", "display_name"]) ?? null;
      const email = getString(prof, ["email"]) ?? null; // sekarang ambil dari profiles.email

      return {
        id,
        full_name,
        email,
      };
    });

    const simpleStudents = rows.map((row) => ({
      id: Number(row["id"] ?? 0),
      class_id: Number(row["class_id"] ?? classId),
      student_id: String(row["student_id"] ?? ""),
      added_at: typeof row["added_at"] === "string" ? row["added_at"] : null,
      start_date:
        typeof row["start_date"] === "string" ? row["start_date"] : null,
      end_date: typeof row["end_date"] === "string" ? row["end_date"] : null,
    }));

    return NextResponse.json({
      ok: true,
      students: simpleStudents,
      profiles,
    });
  } catch (err) {
    console.error("students-list route error", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
