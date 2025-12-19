// src/app/api/teacher/classes/route.ts

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

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // auth
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user ?? null;
    if (!user)
      return NextResponse.json(
        { ok: false, error: "Unauthenticated" },
        { status: 401 }
      );

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      profileError ||
      !profile ||
      (profile.role !== "teacher" && profile.role !== "admin")
    ) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // ambil kelas teacher
    const { data, error } = await supabase
      .from("class_teachers")
      .select(
        `
        class_id,
        classes:classes (
          id,
          name,
          subject,
          grade
        )
      `
      )
      .eq("teacher_id", user.id);

    if (error) {
      console.error("teacher classes error", error);
      return NextResponse.json(
        { ok: false, error: "Failed fetch classes" },
        { status: 500 }
      );
    }

    const classes = (data ?? []).map((row) => {
      const r = row as Raw;
      const cls = r["classes"] as Raw | null;

      return {
        id: Number(r["class_id"]),
        name: getString(cls, "name"),
        subject: getString(cls, "subject"),
        grade: getString(cls, "grade"),
      };
    });

    return NextResponse.json({ ok: true, classes });
  } catch (err) {
    console.error("GET /api/teacher/classes", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
