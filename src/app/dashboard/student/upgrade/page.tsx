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

  
  const { data: profile } = await supabase
    .from("profiles")
    .select("learning_track")
    .eq("id", user.id)
    .single<{ learning_track?: string | null }>();

  const isCoding = profile?.learning_track === "coding";

  const { isPremium } = await getUserSubscriptionStatus();

  let hasPending = false;
  let codingApproved = false;

  if (isCoding) {
    const { data: codingRow } = await supabase
      .from("coding_registrations")
      .select("id, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string; status: string }>();

    hasPending = codingRow?.status === "pending";
    codingApproved = codingRow?.status === "approved";
  } else {
    const { data: pendingPayment } = await supabase
      .from("payments")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .limit(1)
      .maybeSingle<{ id: string }>();

    hasPending = !!pendingPayment;
  }

  const { data: plans, error } = await supabase
    .from("subscription_plans")
    .select("id, name, code, description, price_idr, duration_days")
    .eq("is_active", true)
    .order("price_idr", { ascending: true });

  if (error) {
    console.error("Error fetching plans:", error);
  }

  const filteredPlans = (plans || []).filter((plan) =>
    isCoding ? plan.code.startsWith("CODING_") : !plan.code.startsWith("CODING_")
  );


  return (
    <div className="space-y-6 text-slate-100">
      <div className="space-y-2 rounded-2xl border border-slate-700 bg-slate-900/70 p-4 shadow-[0_20px_60px_-45px_rgba(0,0,0,0.7)]">
        <h1 className="text-2xl font-extrabold text-white">
          {isCoding ? "Upgrade Kelas Coding ?" : "Upgrade ke MathKids Premium ?"}
        </h1>
        <p className="text-xs text-slate-200">
          Pilih paket yang kamu mau, lalu kirim permintaan upgrade. Admin akan
          memproses pembayaranmu.
        </p>
      </div>

      {!isCoding && (
      <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 shadow-xl shadow-black/40">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <span>📌</span>
          <span>Ringkasan Perbandingan</span>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-[720px] w-full text-xs text-slate-200">
            <thead>
              <tr className="border-b border-slate-700 text-left text-[11px] uppercase tracking-[0.2em] text-slate-400">
                <th className="py-2">Fitur</th>
                <th className="py-2">Free</th>
                <th className="py-2">Belajar</th>
                <th className="py-2">Premium</th>
                <th className="py-2">Intensive</th>
                <th className="py-2">Zoom Premium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr>
                <td className="py-2 text-slate-300">Baca ringkasan materi</td>
                <td className="py-2 text-emerald-300">✓</td>
                <td className="py-2 text-emerald-300">✓</td>
                <td className="py-2 text-emerald-300">✓</td>
                <td className="py-2 text-emerald-300">✓</td>
                <td className="py-2 text-emerald-300">✓</td>
              </tr>
              <tr>
                <td className="py-2 text-slate-300">Tonton full video</td>
                <td className="py-2 text-slate-500">✕</td>
                <td className="py-2 text-emerald-300">✓</td>
                <td className="py-2 text-emerald-300">✓</td>
                <td className="py-2 text-emerald-300">✓</td>
                <td className="py-2 text-emerald-300">✓</td>
              </tr>
              <tr>
                <td className="py-2 text-slate-300">Kerjakan soal</td>
                <td className="py-2">1-4</td>
                <td className="py-2">1-20</td>
                <td className="py-2">1-30</td>
                <td className="py-2">1-40</td>
                <td className="py-2">1-40</td>
              </tr>
              <tr>
                <td className="py-2 text-slate-300">Progress tersimpan</td>
                <td className="py-2 text-slate-500">✕</td>
                <td className="py-2 text-emerald-300">✓</td>
                <td className="py-2 text-emerald-300">✓</td>
                <td className="py-2 text-emerald-300">✓</td>
                <td className="py-2 text-emerald-300">✓</td>
              </tr>
              <tr>
                <td className="py-2 text-slate-300">PR rutin</td>
                <td className="py-2 text-slate-500">✕</td>
                <td className="py-2 text-slate-500">✕</td>
                <td className="py-2 text-slate-500">✕</td>
                <td className="py-2">2 hari sekali</td>
                <td className="py-2 text-slate-500">✕</td>
              </tr>
              <tr>
                <td className="py-2 text-slate-300">Try-Out</td>
                <td className="py-2 text-slate-500">✕</td>
                <td className="py-2 text-slate-500">✕</td>
                <td className="py-2">1x/bulan</td>
                <td className="py-2">Mingguan</td>
                <td className="py-2">2x besar</td>
              </tr>
              <tr>
                <td className="py-2 text-slate-300">Report skor</td>
                <td className="py-2 text-slate-500">✕</td>
                <td className="py-2 text-emerald-300">✓</td>
                <td className="py-2 text-emerald-300">✓</td>
                <td className="py-2 text-emerald-300">✓ (paling detail)</td>
                <td className="py-2 text-emerald-300">✓</td>
              </tr>
              <tr>
                <td className="py-2 text-slate-300">Badge akun</td>
                <td className="py-2 text-slate-500">✕</td>
                <td className="py-2 text-slate-500">✕</td>
                <td className="py-2">Premium</td>
                <td className="py-2">Intensive</td>
                <td className="py-2">3-Month</td>
              </tr>
              <tr>
                <td className="py-2 text-slate-300">Support chat</td>
                <td className="py-2 text-slate-500">✕</td>
                <td className="py-2">Standar</td>
                <td className="py-2">Prioritas</td>
                <td className="py-2">Prioritas</td>
                <td className="py-2">Prioritas</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      )}

      <UpgradeClient
        plans={filteredPlans as PlanRow[]}
        initialIsPremium={isPremium || (isCoding && codingApproved)}
        initialHasPending={hasPending}
      />
    </div>
  );
}
