import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const subscription_id = body.subscription_id;

    if (!subscription_id) {
      return NextResponse.json(
        { ok: false, error: "subscription_id required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // auth check
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user ?? null;

    if (!user)
      return NextResponse.json(
        { ok: false, error: "Unauthenticated" },
        { status: 401 }
      );

    // admin check
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

    // AMBIL SUBSCRIPTION SESUAI TABEL KAMU
    const { data: sub, error: subErr } = await supabase
      .from("subscriptions")
      .select("id, user_id, plan_id, start_at, end_at")
      .eq("id", subscription_id)
      .single();

    if (subErr || !sub) {
      return NextResponse.json(
        { ok: false, error: "Subscription not found" },
        { status: 404 }
      );
    }

    const student_id = sub.user_id; // SESUAI TABEL KAMU
    const start_date = sub.start_at;
    const end_date = sub.end_at;

    // AMBIL plan untuk zoom_sessions_per_month
    const { data: plan, error: planErr } = await supabase
      .from("subscription_plans")
      .select("zoom_sessions_per_month")
      .eq("id", sub.plan_id)
      .single();

    if (planErr || !plan) {
      return NextResponse.json(
        { ok: false, error: "Plan not found" },
        { status: 400 }
      );
    }

    const allowed_sessions = plan.zoom_sessions_per_month;

    // AMBIL kelas yang student ikuti
    const { data: classList, error: classErr } = await supabase
      .from("class_students")
      .select("class_id")
      .eq("student_id", student_id);

    if (classErr) {
      return NextResponse.json(
        { ok: false, error: "Cannot fetch class list" },
        { status: 500 }
      );
    }

    if (!classList || classList.length === 0) {
      return NextResponse.json({
        ok: true,
        created: 0,
        message: "Student tidak masuk kelas manapun",
      });
    }

    // MASUKKAN QUOTA (upsert agar tidak duplikasi)
    const quotaRows = classList.map((row) => ({
      class_id: row.class_id,
      student_id,
      subscription_id,
      period_start: start_date,
      period_end: end_date,
      allowed_sessions,
      used_sessions: 0,
    }));

    const { error: quotaErr } = await supabase
      .from("class_student_zoom_quota")
      .upsert(quotaRows, {
        onConflict: "class_id, student_id, subscription_id",
      });

    if (quotaErr) {
      console.error("quota error:", quotaErr);
      return NextResponse.json(
        { ok: false, error: "Failed to generate quota" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      created: quotaRows.length,
    });
  } catch (err) {
    console.error("generate quota error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
