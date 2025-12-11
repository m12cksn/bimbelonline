// src/lib/subcription.ts
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export type UserSubscriptionStatus = {
  isPremium: boolean;
  isPending: boolean;
  planName: string | null;
  planCode: string | null;
  endAt: string | null;
};

// Tipe untuk relasi plan di query
type SubscriptionPlanRel =
  | { name: string | null; code: string | null }
  | { name: string | null; code: string | null }[];

// Tipe row subscriptions + relasi
type SubscriptionWithPlan = {
  id: string;
  status: string;
  start_at: string;
  end_at: string;
  subscription_plans?: SubscriptionPlanRel;
};

export async function getUserSubscriptionStatus(): Promise<UserSubscriptionStatus> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      isPremium: false,
      isPending: false,
      planName: null,
      planCode: null,
      endAt: null,
    };
  }

  const nowIso = new Date().toISOString();

  // ✅ 1. Cek subscription active
  const { data: activeSub } = await supabase
    .from("subscriptions")
    .select(
      `
        id,
        status,
        start_at,
        end_at,
        subscription_plans (
          name,
          code
        )
      `
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .lte("start_at", nowIso)
    .gte("end_at", nowIso)
    .order("end_at", { ascending: false })
    .limit(1)
    .maybeSingle<SubscriptionWithPlan>();

  if (activeSub) {
    const rel = activeSub.subscription_plans;

    let planName: string | null = null;
    let planCode: string | null = null;

    if (Array.isArray(rel)) {
      if (rel.length > 0) {
        planName = rel[0]?.name ?? null;
        planCode = rel[0]?.code ?? null;
      }
    } else if (rel) {
      planName = rel.name ?? null;
      planCode = rel.code ?? null;
    }

    return {
      isPremium: true,
      isPending: false,
      planName,
      planCode,
      endAt: activeSub.end_at ?? null,
    };
  }

  // ✅ 2. Kalau belum premium → cek apakah ada payment pending
  const { data: pendingPayment } = await supabase
    .from("payments")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .limit(1)
    .maybeSingle<{ id: string }>();

  return {
    isPremium: false,
    isPending: !!pendingPayment,
    planName: null,
    planCode: null,
    endAt: null,
  };
}
