// app/dashboard/admin/payments/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import PaymentsToastClient from "./payment_toast_client";

type PaymentRow = {
  id: string;
  user_id: string;
  amount_idr: number;
  status: string;
  created_at: string;
  subscription_plans: {
    name: string | null;
  } | null;
};

export default async function AdminPaymentsPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // cek role admin
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    redirect("/dashboard/student");
  }

  const { data: payments, error } = await supabase
    .from("payments")
    .select(
      `
        id,
        user_id,
        amount_idr,
        status,
        created_at,
        subscription_plans (
          name
        )
      `
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .returns<PaymentRow[]>();

  if (error) {
    console.error("Admin payments error:", error);
  }

  const list: PaymentRow[] = payments || [];

  return (
    <>
      <PaymentsToastClient />

      <div className="space-y-4 text-slate-50">
        <h1 className="text-2xl font-extrabold text-white">
          Permintaan Upgrade (Pending)
        </h1>

        {list.length === 0 && (
          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 text-xs text-slate-300">
            Belum ada permintaan upgrade.
          </div>
        )}

        <div className="space-y-3">
          {list.map((p) => (
            <div
              key={p.id}
              className="grid gap-2 rounded-2xl border border-slate-700 bg-slate-900/80 p-4 md:grid-cols-5 text-xs"
            >
              <div>
                <div className="text-slate-400">User ID</div>
                <div className="break-all">{p.user_id}</div>
              </div>

              <div>
                <div className="text-slate-400">Paket</div>
                <div>{p.subscription_plans?.name ?? "-"}</div>
              </div>

              <div>
                <div className="text-slate-400">Nominal</div>
                <div className="font-semibold">
                  Rp {p.amount_idr.toLocaleString("id-ID")}
                </div>
              </div>

              <div>
                <div className="text-slate-400">Tanggal</div>
                <div>{new Date(p.created_at).toLocaleString("id-ID")}</div>
              </div>

              <div className="flex flex-wrap gap-2">
                <form action={`/api/adm/payments/${p.id}`} method="POST">
                  <input type="hidden" name="action" value="approve" />
                  <button
                    type="submit"
                    className="rounded-xl border border-emerald-400/70 bg-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-100 hover:bg-emerald-500/40"
                  >
                    ✅ Approve
                  </button>
                </form>

                <form action={`/api/adm/payments/${p.id}`} method="POST">
                  <input type="hidden" name="action" value="reject" />
                  <button
                    type="submit"
                    className="rounded-xl border border-red-400/70 bg-red-500/20 px-3 py-1 text-[11px] font-semibold text-red-100 hover:bg-red-500/40"
                  >
                    ❌ Reject
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
