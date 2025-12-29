// src/app/api/adm/classes/[classId]/attendance/[zoomId]/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type Raw = Record<string, unknown>;

export async function GET(
  _req: Request,
  {
    params,
  }: {
    params:
      | { id: string; zoomId: string }
      | Promise<{ id: string; zoomId: string }>;
  }
) {
  try {
    const resolved =
      typeof params === "object" && "then" in params ? await params : params;

    const classId = Number(resolved.id);
    const zoomId = Number(resolved.zoomId);

    if (Number.isNaN(classId) || Number.isNaN(zoomId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid parameter" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // auth
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    // cek admin
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

    // ambil absensi + profile siswa
    const { data, error } = await supabase
      .from("class_zoom_attendance")
      .select(
        `
        id,
        created_at,
        profiles:profiles!student_id (
          id,
          full_name,
          email
        )
      `
      )
      .eq("zoom_id", zoomId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("attendance detail error", error);
      return NextResponse.json(
        { ok: false, error: "Failed to fetch attendance detail" },
        { status: 500 }
      );
    }

    const attendance = (data ?? []).map((row) => {
      const r = row as Raw;
      const profilesRaw = r["profiles"];
      const p =
        Array.isArray(profilesRaw) && profilesRaw.length > 0
          ? (profilesRaw[0] as Raw)
          : null;

      return {
        student_id: p ? String(p["id"]) : "",
        full_name:
          p && typeof p["full_name"] === "string" ? p["full_name"] : null,
        email: p && typeof p["email"] === "string" ? p["email"] : null,
        attended_at: String(r["created_at"]),
      };
    });

    return NextResponse.json({ ok: true, attendance });
  } catch (err) {
    console.error("attendance detail fatal", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
