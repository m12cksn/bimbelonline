// src/app/api/adm/classes/[id]/attendance/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type Raw = Record<string, unknown>;

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

    // 🔐 auth
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    // 🔐 cek role admin
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

    /**
     * Ambil sesi zoom + jumlah hadir
     * LEFT JOIN supaya sesi tanpa kehadiran tetap muncul
     */
    const { data, error } = await supabase
      .from("class_zoom_sessions")
      .select(
        `
        id,
        title,
        start_time,
        end_time,
        attendance:class_zoom_attendance (
          id
        )
      `
      )
      .eq("class_id", classId)
      .order("start_time", { ascending: true });

    if (error) {
      console.error("attendance list error", error);
      return NextResponse.json(
        { ok: false, error: "Failed to fetch attendance list" },
        { status: 500 }
      );
    }

    const sessions = (data ?? []).map((row) => {
      const r = row as Raw;
      const attendance = Array.isArray(r["attendance"])
        ? (r["attendance"] as unknown[])
        : [];

      return {
        id: Number(r["id"]),
        title: typeof r["title"] === "string" ? r["title"] : null,
        start_time: String(r["start_time"]),
        end_time: String(r["end_time"]),
        total_present: attendance.length,
      };
    });

    return NextResponse.json({
      ok: true,
      sessions,
    });
  } catch (err) {
    console.error("GET attendance fatal error", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
