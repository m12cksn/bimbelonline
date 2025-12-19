import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type SubscriptionRow = {
  id: string;
  user_id: string | null;
  plan_id: string | null;
  status: string | null;
  start_at: string | null;
  end_at: string | null;
};

type PlanRow = {
  id: string;
  name: string | null;
  zoom_per_month: number | null;
};

type ClassStudentRow = {
  class_id: number;
  student_id: string;
};

export async function POST(
  _req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolved =
      typeof params === "object" && "then" in params ? await params : params;

    const subscriptionId = resolved.id;

    const supabase = await createSupabaseServerClient();

    // 🔐 auth & admin
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

    // 1) ambil subscription
    const { data: subData, error: subErr } = await supabase
      .from("subscriptions")
      .select("id, user_id, plan_id, status, start_at, end_at")
      .eq("id", subscriptionId)
      .single();

    if (subErr || !subData) {
      console.error("subscription fetch error:", subErr);
      return NextResponse.json(
        { ok: false, error: "Subscription tidak ditemukan" },
        { status: 404 }
      );
    }

    const sub = subData as SubscriptionRow;

    if (!sub.user_id || !sub.plan_id) {
      return NextResponse.json(
        { ok: false, error: "User atau plan belum di-set di subscription" },
        { status: 400 }
      );
    }

    // 2) ambil plan
    const { data: planData, error: planErr } = await supabase
      .from("plans")
      .select("id, name, zoom_per_month")
      .eq("id", sub.plan_id)
      .single();

    if (planErr || !planData) {
      console.error("plan fetch error:", planErr);
    }

    const plan = (planData ?? null) as PlanRow | null;
    const zoomPerMonth = plan?.zoom_per_month ?? 8;

    // 3) kelas student ini
    const { data: csData, error: csErr } = await supabase
      .from("class_students")
      .select("class_id, student_id")
      .eq("student_id", sub.user_id);

    if (csErr) {
      console.error("class_students fetch error:", csErr);
      return NextResponse.json(
        { ok: false, error: "Gagal mengambil kelas student" },
        { status: 500 }
      );
    }

    const rels = (csData ?? []) as ClassStudentRow[];

    if (rels.length === 0) {
      return NextResponse.json({
        ok: true,
        created: 0,
        message: "Student belum tergabung di kelas manapun",
      });
    }

    // 4) update allowed_sessions berdasarkan plan
    const rows = rels.map((r) => ({
      class_id: r.class_id,
      student_id: r.student_id,
      allowed_sessions: zoomPerMonth,
      // used_sessions sengaja tidak di-set supaya tidak di-reset
    }));

    const { data: upserted, error: upErr } = await supabase
      .from("class_student_zoom_quota")
      .upsert(rows, {
        onConflict: "class_id,student_id",
        ignoreDuplicates: false,
      })
      .select("class_id, student_id");

    if (upErr) {
      console.error("quota upsert error:", upErr);
      return NextResponse.json(
        { ok: false, error: "Gagal sync quota Zoom" },
        { status: 500 }
      );
    }

    const count = Array.isArray(upserted) ? upserted.length : 0;

    return NextResponse.json({
      ok: true,
      created: count,
      message: `Quota Zoom disinkronkan untuk ${count} kelas.`,
    });
  } catch (err) {
    console.error("sync-zoom-quota fatal:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
