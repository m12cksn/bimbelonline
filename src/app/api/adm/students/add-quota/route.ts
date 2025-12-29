import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type Body = {
  student_id?: string;
  add_sessions?: number;
};

type SubscriptionRow = {
  id: string;
  user_id: string | null;
  status: string | null;
  start_at: string | null;
  end_at: string | null;
  created_at: string | null;
};

type ClassStudentRow = {
  class_id: number;
};

type QuotaRow = {
  class_id: number;
  allowed_sessions: number;
  used_sessions: number;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const studentId = body.student_id?.trim();
    const addSessions = Number(body.add_sessions ?? 0);

    if (!studentId || !addSessions || addSessions <= 0) {
      return NextResponse.json(
        { ok: false, error: "student_id dan add_sessions wajib diisi" },
        { status: 400 }
      );
    }

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

    const { data: subData, error: subErr } = await supabase
      .from("subscriptions")
      .select("id, user_id, status, start_at, end_at, created_at")
      .eq("user_id", studentId)
      .order("start_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<SubscriptionRow>();

    if (subErr) {
      console.error("fetch latest subscription error:", subErr);
      return NextResponse.json(
        { ok: false, error: "Gagal mengambil subscription student" },
        { status: 500 }
      );
    }

    if (!subData) {
      return NextResponse.json(
        { ok: false, error: "Student belum memiliki subscription" },
        { status: 400 }
      );
    }

    const { data: classLinks, error: clsErr } = await supabase
      .from("class_students")
      .select("class_id")
      .eq("student_id", studentId);

    if (clsErr) {
      console.error("fetch class_students error:", clsErr);
      return NextResponse.json(
        { ok: false, error: "Gagal mengambil kelas student" },
        { status: 500 }
      );
    }

    const classes = (classLinks ?? []) as ClassStudentRow[];
    if (classes.length === 0) {
      return NextResponse.json({
        ok: true,
        updated: 0,
        message: "Student belum tergabung di kelas manapun",
      });
    }

    const { data: quotaData, error: quotaErr } = await supabase
      .from("class_student_zoom_quota")
      .select("class_id, allowed_sessions, used_sessions")
      .eq("student_id", studentId)
      .eq("subscription_id", subData.id);

    if (quotaErr) {
      console.error("fetch existing quota error:", quotaErr);
      return NextResponse.json(
        { ok: false, error: "Gagal mengambil kuota student" },
        { status: 500 }
      );
    }

    const quotaByClass = new Map<number, QuotaRow>();
    (quotaData ?? []).forEach((row) => {
      quotaByClass.set(row.class_id, row as QuotaRow);
    });

    const rows = classes.map((c) => {
      const existing = quotaByClass.get(c.class_id);
      const allowed =
        (existing?.allowed_sessions ?? 0) + Math.max(0, addSessions);
      const used = existing?.used_sessions ?? 0;
      return {
        class_id: c.class_id,
        student_id: studentId,
        subscription_id: subData.id,
        period_start: subData.start_at,
        period_end: subData.end_at,
        allowed_sessions: allowed,
        used_sessions: used,
      };
    });

    const { data: upserted, error: upErr } = await supabase
      .from("class_student_zoom_quota")
      .upsert(rows, {
        onConflict: "class_id,student_id",
      })
      .select("class_id");

    if (upErr) {
      console.error("add quota upsert error:", upErr);
      return NextResponse.json(
        { ok: false, error: "Gagal menambahkan kuota student" },
        { status: 500 }
      );
    }

    const updated = Array.isArray(upserted) ? upserted.length : 0;

    return NextResponse.json({
      ok: true,
      updated,
      message: `Kuota ditambahkan untuk ${updated} kelas.`,
    });
  } catch (err) {
    console.error("add quota fatal:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
