import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type RawSubscription = {
  id: string;
  user_id: string | null;
  plan_id: string | null;
  status: string | null;
  start_at: string | null;
  end_at: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type PlanRow = {
  id: string;
  name: string | null;
  zoom_per_month: number | null;
};

type QuotaRow = {
  student_id: string;
  allowed_sessions: number;
  used_sessions: number;
};

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // 🔐 cek login
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    // 🔐 pastikan admin
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

    // 1) ambil semua subscriptions
    const { data: subsData, error: subsErr } = await supabase
      .from("subscriptions")
      .select("id, user_id, plan_id, status, start_at, end_at")
      .order("created_at", { ascending: false });

    if (subsErr) {
      console.error("subscriptions fetch error:", subsErr);
      return NextResponse.json(
        { ok: false, error: "Gagal mengambil subscriptions" },
        { status: 500 }
      );
    }

    const subs = (subsData ?? []) as RawSubscription[];

    if (subs.length === 0) {
      return NextResponse.json({ ok: true, subscriptions: [] });
    }

    // 2) kumpulkan user_id & plan_id unik
    const userIds = Array.from(
      new Set(subs.map((s) => s.user_id).filter(Boolean) as string[])
    );
    const planIds = Array.from(
      new Set(subs.map((s) => s.plan_id).filter(Boolean) as string[])
    );

    // 3) ambil profiles
    let profiles: ProfileRow[] = [];
    if (userIds.length > 0) {
      const { data: profData, error: profErr } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      if (profErr) {
        console.error("profiles fetch error:", profErr);
      } else {
        profiles = (profData ?? []) as ProfileRow[];
      }
    }

    // 4) ambil plans
    let plans: PlanRow[] = [];
    if (planIds.length > 0) {
      const { data: planData, error: planErr } = await supabase
        .from("plans")
        .select("id, name, zoom_per_month")
        .in("id", planIds);

      if (planErr) {
        console.error("plans fetch error:", planErr);
      } else {
        plans = (planData ?? []) as PlanRow[];
      }
    }

    // 5) ambil quota per student (total semua kelas)
    let quotas: QuotaRow[] = [];
    if (userIds.length > 0) {
      const { data: quotaData, error: quotaErr } = await supabase
        .from("class_student_zoom_quota")
        .select("student_id, allowed_sessions, used_sessions")
        .in("student_id", userIds);

      if (quotaErr) {
        console.error("quota fetch error:", quotaErr);
      } else {
        quotas = (quotaData ?? []) as QuotaRow[];
      }
    }

    // map bantu
    const profileMap = new Map<string, ProfileRow>();
    profiles.forEach((p) => profileMap.set(p.id, p));

    const planMap = new Map<string, PlanRow>();
    plans.forEach((p) => planMap.set(p.id, p));

    // agregasi quota per student
    const quotaAgg = new Map<
      string,
      { allowed_sessions: number; used_sessions: number }
    >();

    quotas.forEach((q) => {
      const prev = quotaAgg.get(q.student_id) ?? {
        allowed_sessions: 0,
        used_sessions: 0,
      };
      prev.allowed_sessions += q.allowed_sessions;
      prev.used_sessions += q.used_sessions;
      quotaAgg.set(q.student_id, prev);
    });

    // 6) bentuk hasil akhir
    const result = subs.map((s) => {
      const prof = s.user_id ? profileMap.get(s.user_id) ?? null : null;
      const plan = s.plan_id ? planMap.get(s.plan_id) ?? null : null;
      const q = s.user_id ? quotaAgg.get(s.user_id) ?? null : null;

      return {
        id: s.id,
        status: s.status,
        start_at: s.start_at,
        end_at: s.end_at,
        user_id: s.user_id,
        profiles: prof,
        plans: plan,
        class_student_zoom_quota: q,
      };
    });

    return NextResponse.json({ ok: true, subscriptions: result });
  } catch (err) {
    console.error("subscriptions GET fatal:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
