import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import AccountForm from "./account_form";
import AccountPhoto from "./account_photo";

type SubscriptionRow = {
  id: string;
  plan_id: string | null;
  status: string | null;
  start_at: string | null;
  end_at: string | null;
  subscription_plans: {
    name: string | null;
    code: string | null;
  } | null;
};

type ZoomQuotaRow = {
  allowed_sessions: number | null;
  used_sessions: number | null;
  period_start: string | null;
  period_end: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function remainingDays(endAt: string | null) {
  if (!endAt) return null;
  const end = new Date(endAt).getTime();
  if (Number.isNaN(end)) return null;
  const diff = end - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default async function StudentAccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone, role, is_premium, created_at, avatar_url")
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.email ||
    "Student";

  const email = profile?.email || user.email || "-";
  const phone = profile?.phone || "-";
  const isPremium = profile?.is_premium === true;

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select(
      "id, plan_id, status, start_at, end_at, subscription_plans!fk_subscriptions_plan ( name, code )"
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("end_at", { ascending: false })
    .limit(1)
    .maybeSingle<SubscriptionRow>();

  if (subscriptionError) {
    console.error("subscription fetch error:", subscriptionError);
  }

  let planName = subscription?.subscription_plans?.name ?? null;
  let planCode = subscription?.subscription_plans?.code ?? null;

  if (!planName && subscription?.plan_id) {
    const { data: planRow, error: planError } = await supabase
      .from("subscription_plans")
      .select("name, code")
      .eq("id", subscription.plan_id)
      .maybeSingle<{ name: string | null; code: string | null }>();

    if (planError) {
      console.error("subscription plan fallback error:", planError);
    } else {
      planName = planRow?.name ?? null;
      planCode = planRow?.code ?? null;
    }
  }

  const daysLeft = remainingDays(subscription?.end_at ?? null);

  const { data: quotaRows } = await supabase
    .from("class_student_zoom_quota")
    .select("allowed_sessions, used_sessions, period_start, period_end")
    .eq("student_id", user.id)
    .order("period_start", { ascending: false });

  const now = Date.now();
  const activeQuota = (quotaRows as ZoomQuotaRow[] | null)?.filter((row) => {
    if (!row.period_start || !row.period_end) return false;
    const start = new Date(row.period_start).getTime();
    const end = new Date(row.period_end).getTime();
    if (Number.isNaN(start) || Number.isNaN(end)) return false;
    return start <= now && end >= now;
  }) ?? [];

  const totalAllowed = activeQuota.reduce(
    (sum, row) => sum + (row.allowed_sessions ?? 0),
    0
  );
  const totalUsed = activeQuota.reduce(
    (sum, row) => sum + (row.used_sessions ?? 0),
    0
  );
  const totalRemaining = Math.max(totalAllowed - totalUsed, 0);

  const startDates = activeQuota
    .map((row) => row.period_start)
    .filter((value): value is string => !!value)
    .sort();
  const endDates = activeQuota
    .map((row) => row.period_end)
    .filter((value): value is string => !!value)
    .sort();

  const periodStart = startDates[0] ?? null;
  const periodEnd = endDates[endDates.length - 1] ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Akun & Langganan
          </h1>
          <p className="text-sm text-slate-600">
            Lihat informasi profil, status paket, dan akses pembayaran.
          </p>
        </div>
        <Link
          href="/dashboard/student/upgrade"
          className="rounded-xl border border-emerald-200 bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600"
        >
          Upgrade paket
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.45fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Account Management
            </p>
            <span className="text-xs text-slate-400">Student</span>
          </div>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <AccountPhoto
              initialAvatarUrl={profile?.avatar_url ?? ""}
              displayName={displayName}
              email={email}
            />
          </div>

          <div className="mt-5 space-y-3 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span>Status akun</span>
              <span
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                  isPremium
                    ? "border-amber-300 bg-amber-100 text-amber-800"
                    : "border-emerald-200 bg-emerald-100 text-emerald-700"
                }`}
              >
                {isPremium ? "Premium" : "Gratis"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Bergabung</span>
              <span className="font-semibold">
                {formatDate(profile?.created_at ?? null)}
              </span>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Profile Information
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                Kelola profil kamu
              </h2>
            </div>
            <Link
              href="/dashboard/student/upgrade"
              className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700"
            >
              {planName ?? "Free"}
            </Link>
          </div>

          <AccountForm
            initialFullName={profile?.full_name ?? displayName}
            initialPhone={profile?.phone ?? ""}
            email={email}
            role={profile?.role ?? "student"}
          />

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Status Langganan
            </p>
            <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
              <div>
                <p className="text-[11px] text-slate-400">Paket aktif</p>
                <p className="font-semibold text-slate-900">
                  {planName ?? "Belum ada paket"}
                </p>
                <p className="text-[11px] text-slate-400">{planCode ?? "FREE"}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">Sisa hari</p>
                <p className="font-semibold text-slate-900">
                  {daysLeft === null ? "-" : `${daysLeft} hari`}
                </p>
              </div>
            </div>

            {!subscription && (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-[11px] text-emerald-700">
                Upgrade untuk membuka fitur premium dan kuota Zoom tambahan.
              </div>
            )}
          </div>

          <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600 sm:grid-cols-2">
            <div className="flex items-center justify-between">
              <span>Status</span>
              <span className="font-semibold">
                {subscription?.status ?? "inactive"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Mulai</span>
              <span className="font-semibold">
                {formatDate(subscription?.start_at ?? null)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Berakhir</span>
              <span className="font-semibold">
                {formatDate(subscription?.end_at ?? null)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Kuota Zoom aktif</span>
              <span className="font-semibold">
                {totalRemaining} / {totalAllowed}
              </span>
            </div>
            <div className="flex items-center justify-between sm:col-span-2">
              <span>Periode kuota</span>
              <span className="font-semibold">
                {periodStart && periodEnd
                  ? `${formatDate(periodStart)} - ${formatDate(periodEnd)}`
                  : "-"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px]">
            <Link
              href="/dashboard/student/payments"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
            >
              Riwayat pembayaran
            </Link>
            <Link
              href="/dashboard/student/upgrade"
              className="rounded-xl border border-emerald-200 bg-emerald-500 px-3 py-2 font-semibold text-white hover:bg-emerald-600"
            >
              Upgrade paket
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
