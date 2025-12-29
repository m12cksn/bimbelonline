import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type SubscriptionRow = {
  id: string;
  user_id: string | null;
  plan_id: string | null;
  status: string | null;
  start_at: string | null;
  end_at: string | null;
  created_at: string | null;
};

type RawPlanRow = Record<string, unknown>;

type QuotaRow = {
  student_id: string;
  subscription_id: string | null;
  allowed_sessions: number;
  used_sessions: number;
};

type StudentSummary = {
  id: string;
  full_name: string | null;
  email: string | null;
  subscription: {
    id: string;
    status: string | null;
    start_at: string | null;
    end_at: string | null;
    plan_name: string | null;
  } | null;
  quota: {
    allowed_sessions: number;
    used_sessions: number;
    remaining_sessions: number;
  };
  remaining_days: number | null;
};

function parseDate(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function computeRemainingDays(endAt: string | null) {
  const end = parseDate(endAt);
  if (!end) return null;
  const diffMs = end.getTime() - Date.now();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(days, 0);
}

export async function GET() {
  try {
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

    const { data: profilesData, error: profilesErr } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "student");

    if (profilesErr) {
      console.error("profiles fetch error:", profilesErr);
      return NextResponse.json(
        { ok: false, error: "Gagal mengambil daftar student" },
        { status: 500 }
      );
    }

    const profiles = (profilesData ?? []) as ProfileRow[];
    if (profiles.length === 0) {
      return NextResponse.json({ ok: true, students: [] });
    }

    const studentIds = profiles.map((p) => p.id);

    const { data: subscriptionsData, error: subsErr } = await supabase
      .from("subscriptions")
      .select("id, user_id, plan_id, status, start_at, end_at, created_at")
      .in("user_id", studentIds)
      .order("start_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (subsErr) {
      console.error("subscriptions fetch error:", subsErr);
      return NextResponse.json(
        { ok: false, error: "Gagal mengambil subscriptions" },
        { status: 500 }
      );
    }

    const subscriptions = (subscriptionsData ?? []) as SubscriptionRow[];
    const latestByUser = new Map<string, SubscriptionRow>();

    for (const sub of subscriptions) {
      if (!sub.user_id) continue;
      if (!latestByUser.has(sub.user_id)) {
        latestByUser.set(sub.user_id, sub);
      }
    }

    const planIds = Array.from(
      new Set(
        Array.from(latestByUser.values())
          .map((s) => s.plan_id)
          .filter(Boolean) as string[]
      )
    );

    const planMap = new Map<string, { name: string | null }>();
    if (planIds.length > 0) {
      const { data: planData, error: planErr } = await supabase
        .from("subscription_plans")
        .select("*")
        .in("id", planIds);

      if (planErr) {
        console.error("subscription_plans fetch error:", planErr);
      } else {
        const rawPlans = (planData ?? []) as RawPlanRow[];
        rawPlans.forEach((row) => {
          const id = String(row["id"] ?? "");
          const name =
            typeof row["name"] === "string" ? (row["name"] as string) : null;
          planMap.set(id, { name });
        });
      }
    }

    const { data: quotaData, error: quotaErr } = await supabase
      .from("class_student_zoom_quota")
      .select("student_id, subscription_id, allowed_sessions, used_sessions")
      .in("student_id", studentIds);

    if (quotaErr) {
      console.error("quota fetch error:", quotaErr);
    }

    const quotas = (quotaData ?? []) as QuotaRow[];
    const quotaByStudent = new Map<
      string,
      { allowed: number; used: number }
    >();

    const latestSubIdByStudent = new Map<string, string | null>();
    latestByUser.forEach((sub, studentId) => {
      latestSubIdByStudent.set(studentId, sub.id);
    });

    quotas.forEach((q) => {
      const targetSub = latestSubIdByStudent.get(q.student_id) ?? null;
      if (targetSub && q.subscription_id !== targetSub) return;
      const prev = quotaByStudent.get(q.student_id) ?? {
        allowed: 0,
        used: 0,
      };
      prev.allowed += q.allowed_sessions ?? 0;
      prev.used += q.used_sessions ?? 0;
      quotaByStudent.set(q.student_id, prev);
    });

    const students: StudentSummary[] = profiles.map((p) => {
      const latestSub = latestByUser.get(p.id) ?? null;
      const planName =
        latestSub?.plan_id && planMap.has(latestSub.plan_id)
          ? planMap.get(latestSub.plan_id)?.name ?? null
          : null;
      const quota = quotaByStudent.get(p.id) ?? { allowed: 0, used: 0 };
      const remainingSessions = Math.max(quota.allowed - quota.used, 0);

      return {
        id: p.id,
        full_name: p.full_name ?? null,
        email: p.email ?? null,
        subscription: latestSub
          ? {
              id: latestSub.id,
              status: latestSub.status ?? null,
              start_at: latestSub.start_at ?? null,
              end_at: latestSub.end_at ?? null,
              plan_name: planName,
            }
          : null,
        quota: {
          allowed_sessions: quota.allowed,
          used_sessions: quota.used,
          remaining_sessions: remainingSessions,
        },
        remaining_days: computeRemainingDays(latestSub?.end_at ?? null),
      };
    });

    return NextResponse.json({ ok: true, students });
  } catch (err) {
    console.error("subscriptions GET fatal:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
