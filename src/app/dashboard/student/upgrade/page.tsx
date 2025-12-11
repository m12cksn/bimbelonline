// app/dashboard/student/upgrade/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import UpgradeClient from "./upgrade_client";
import { getUserSubscriptionStatus } from "@/lib/subcription";

type PlanRow = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  price_idr: number;
  duration_days: number;
};

export default async function UpgradePage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { isPremium } = await getUserSubscriptionStatus();

  // cek apakah sudah ada payment pending
  const { data: pendingPayment } = await supabase
    .from("payments")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .limit(1)
    .maybeSingle<{ id: string }>();

  const hasPending = !!pendingPayment;

  const { data: plans, error } = await supabase
    .from("subscription_plans")
    .select("id, name, code, description, price_idr, duration_days")
    .eq("is_active", true)
    .order("price_idr", { ascending: true });

  if (error) {
    console.error("Error fetching plans:", error);
  }

  return (
    <div className="space-y-4 text-slate-50">
      <h1 className="text-2xl font-extrabold text-white">
        Upgrade ke MathKids Premium ⭐
      </h1>
      <p className="text-xs text-slate-300">
        Pilih paket yang kamu mau, lalu kirim permintaan upgrade. Admin akan
        memproses pembayaranmu.
      </p>

      <UpgradeClient
        plans={(plans || []) as PlanRow[]}
        initialIsPremium={isPremium}
        initialHasPending={hasPending}
      />
    </div>
  );
}
