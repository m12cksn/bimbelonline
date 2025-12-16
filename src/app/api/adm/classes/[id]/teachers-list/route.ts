// src/app/api/adm/classes/[id]/teachers-list/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type Raw = Record<string, unknown>;

function getString(obj: Raw | null | undefined, key: string): string | null {
  if (!obj) return null;
  const v = obj[key];
  if (typeof v === "string" && v.trim() !== "") return v;
  return null;
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

    const { data, error } = await supabase
      .from("class_teachers")
      .select(
        `
        id,
        teacher_id,
        created_at,
        profiles:profiles!teacher_id (
          id,
          full_name,
          email
        )
      `
      )
      .eq("class_id", classId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("teachers-list error", error);
      return NextResponse.json(
        { ok: false, error: "Failed to fetch teachers" },
        { status: 500 }
      );
    }

    const teachers = (data ?? []).map((row) => {
      const r = row as Raw;

      const profilesRaw = r["profiles"];
      console.log("DEBUG profilesRaw:", profilesRaw);

      let profile: Raw | null = null;
      if (Array.isArray(profilesRaw) && profilesRaw.length > 0) {
        profile = profilesRaw[0] as Raw;
      } else if (profilesRaw && typeof profilesRaw === "object") {
        profile = profilesRaw as Raw;
      }

      const fullName = getString(profile, "full_name");
      const email = getString(profile, "email");

      return {
        id: String(r["id"]),
        teacher_id: String(r["teacher_id"]),
        teacher_name:
          fullName && fullName.trim() !== ""
            ? fullName
            : email && email.trim() !== ""
            ? email
            : String(r["teacher_id"]),
        added_at: typeof r["created_at"] === "string" ? r["created_at"] : null,
      };
    });

    return NextResponse.json({ ok: true, teachers });
  } catch (err) {
    console.error("GET teachers-list fatal error", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
