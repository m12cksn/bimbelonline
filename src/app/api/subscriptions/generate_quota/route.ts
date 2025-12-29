import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type Body = {
  subscription_id?: string;
};

type SubscriptionRow = {
  id: string;
  user_id: string | null;
  plan_id: string | null;
  status: string | null;
  start_at: string | null;
  end_at: string | null;
};

type PlanRow = Record<string, unknown>;

type ClassStudentRow = {
  class_id: number;
  student_id: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const subscriptionId = body.subscription_id;

    if (!subscriptionId) {
      return NextResponse.json(
        { ok: false, error: "subscription_id wajib diisi" },
        { status: 400 }
      );
    }

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

    if (sub.status !== "active") {
      return NextResponse.json(
        { ok: false, error: "Subscription belum active / sudah berakhir" },
        { status: 400 }
      );
    }

    if (!sub.user_id || !sub.plan_id) {
      return NextResponse.json(
        { ok: false, error: "User atau plan belum di-set di subscription" },
        { status: 400 }
      );
    }

    // 2) ambil data plan → zoom_per_month
    const { data: planData, error: planErr } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", sub.plan_id)
      .single();

    if (planErr || !planData) {
      console.error("plan fetch error:", planErr);
      // fallback default 8 sesi/bulan
    }

    const plan = (planData ?? null) as PlanRow | null;
    const rawZoom =
      plan?.["zoom_sessions_per_month"] ?? plan?.["zoom_per_month"];
    const zoomPerMonth =
      typeof rawZoom === "number"
        ? rawZoom
        : typeof rawZoom === "string" && rawZoom.trim() !== ""
        ? Number(rawZoom)
        : null;
    const allowedPerMonth = zoomPerMonth ?? 8;

    // 3) cari semua kelas yang diikuti student ini
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

    // 4) buat / update quota per kelas
    const rows = rels.map((r) => ({
      class_id: r.class_id,
      student_id: r.student_id,
      subscription_id: subscriptionId,
      period_start: sub.start_at,
      period_end: sub.end_at,
      allowed_sessions: allowedPerMonth,
      used_sessions: 0,
    }));

    const { data: upserted, error: upErr } = await supabase
      .from("class_student_zoom_quota")
      .upsert(rows, {
        onConflict: "class_id,student_id",
      })
      .select("class_id, student_id");

    if (upErr) {
      console.error("quota upsert error:", upErr);
      return NextResponse.json(
        { ok: false, error: "Gagal membuat quota Zoom" },
        { status: 500 }
      );
    }

    const created = Array.isArray(upserted) ? upserted.length : 0;

    return NextResponse.json({
      ok: true,
      created,
      message: `Quota Zoom dibuat/diperbarui untuk ${created} kelas.`,
    });
  } catch (err) {
    console.error("generate_quota fatal:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
