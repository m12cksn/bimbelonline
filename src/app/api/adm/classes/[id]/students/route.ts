// src/app/api/adm/classes/[id]/students/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type RawRow = Record<string, unknown>;

/** type guard untuk memeriksa objek error yang mungkin punya code (PG error) */
function hasCodeProp(v: unknown): v is { code?: unknown } {
  return typeof v === "object" && v !== null && "code" in v;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    // unwrap params jika Promise (Next.js kadang memberikan Promise)
    const resolvedParams =
      typeof params === "object" && "then" in params ? await params : params;
    const classId = Number(resolvedParams?.id);
    if (Number.isNaN(classId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid class id" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({})); // body tetap diambil (unknown)
    const rawBody: unknown = body;

    // ambil student_id & subscription_id secara aman tanpa any
    let student_id: string | undefined;
    let subscription_id: string | null = null;

    if (rawBody && typeof rawBody === "object") {
      const b = rawBody as Record<string, unknown>;
      if (typeof b["student_id"] === "string") {
        student_id = b["student_id"];
      }
      if (typeof b["subscription_id"] === "string") {
        subscription_id = b["subscription_id"];
      } else {
        subscription_id = null;
      }
    }

    if (!student_id) {
      return NextResponse.json(
        { ok: false, error: "student_id required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // auth + admin check
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user ?? null;
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    const { data: profileData, error: profileErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = (profileData && (profileData as RawRow)["role"]) ?? null;
    if (profileErr || role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // jika subscription_id diberikan, ambil data subscription (untuk derive start/end + quota)
    let start_date: string | null = null;
    let end_date: string | null = null;
    let allowedSessions: number | null = null;
    if (subscription_id) {
      const { data: subData, error: subErr } = await supabase
        .from("subscriptions")
        .select("id, user_id, start_at, end_at, status, plan_id")
        .eq("id", subscription_id)
        .single();

      if (subErr || !subData) {
        return NextResponse.json(
          { ok: false, error: "Subscription not found" },
          { status: 404 }
        );
      }

      // optional: check subscription belongs to this student
      const subUserId = (subData as RawRow)["user_id"];
      if (typeof subUserId === "string" && subUserId !== student_id) {
        return NextResponse.json(
          {
            ok: false,
            error: "Subscription does not belong to the given student",
          },
          { status: 400 }
        );
      }

      start_date =
        typeof (subData as RawRow)["start_at"] === "string"
          ? String((subData as RawRow)["start_at"])
          : null;
      end_date =
        typeof (subData as RawRow)["end_at"] === "string"
          ? String((subData as RawRow)["end_at"])
          : null;
      const planId = (subData as RawRow)["plan_id"];
      if (typeof planId === "string" || typeof planId === "number") {
        const { data: planData, error: planErr } = await supabase
          .from("subscription_plans")
          .select("zoom_sessions_per_month")
          .eq("id", planId)
          .single();

        if (planErr || !planData) {
          return NextResponse.json(
            { ok: false, error: "Plan not found" },
            { status: 400 }
          );
        }

        const rawAllowed = (planData as RawRow)["zoom_sessions_per_month"];
        if (typeof rawAllowed === "number") {
          allowedSessions = rawAllowed;
        }
      }
    }

    // masukkan row ke class_students
    const { data: insertData, error: insertErr } = await supabase
      .from("class_students")
      .insert({
        class_id: classId,
        student_id,
        added_by: user.id,
        added_at: new Date().toISOString(),
        start_date,
        end_date,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("add student error", insertErr);
      // Deteksi duplicate unique constraint tanpa `any`
      if (
        hasCodeProp(insertErr) &&
        typeof insertErr.code === "string" &&
        insertErr.code === "23505"
      ) {
        return NextResponse.json(
          { ok: false, error: "Student already in class" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { ok: false, error: "Failed to add student" },
        { status: 500 }
      );
    }

    if (subscription_id && allowedSessions !== null) {
      const { data: existingQuota } = await supabase
        .from("class_student_zoom_quota")
        .select("used_sessions")
        .eq("class_id", classId)
        .eq("student_id", student_id)
        .eq("subscription_id", subscription_id)
        .single();

      const used_sessions =
        existingQuota && typeof existingQuota.used_sessions === "number"
          ? existingQuota.used_sessions
          : 0;

      const { error: quotaErr } = await supabase
        .from("class_student_zoom_quota")
        .upsert(
          {
            class_id: classId,
            student_id,
            subscription_id,
            period_start: start_date,
            period_end: end_date,
            allowed_sessions: allowedSessions,
            used_sessions,
          },
          { onConflict: "class_id,student_id,subscription_id" }
        );

      if (quotaErr) {
        console.error("quota upsert error", quotaErr);
        return NextResponse.json(
          { ok: false, error: "Failed to generate quota" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true, student: insertData });
  } catch (err) {
    console.error("POST /api/adm/classes/[id]/students error", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
