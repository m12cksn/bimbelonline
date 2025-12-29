// app/dashboard/admin/finance/page.tsx
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { UserRole } from "@/lib/type";

type PaymentRow = {
  id: string;
  user_id: string;
  amount_idr: number;
  status: string;
  method: string | null;
  created_at: string;
  subscription_plans: {
    name: string | null;
  } | null;
};

const PAGE_SIZE = 20;

export default async function AdminFinancePage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = props;
  const sp = await searchParams;

  // cek login
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // cek role admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role as UserRole) !== "admin") {
    redirect("/dashboard/student");
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  // ====== RINGKASAN (A1) ======

  // total omzet hari ini
  const { data: todayPayments } = await supabase
    .from("payments")
    .select("amount_idr")
    .eq("status", "confirmed")
    .gte("created_at", todayStart.toISOString());

  const todayTotal =
    todayPayments?.reduce(
      (sum, p: { amount_idr: number }) => sum + (p.amount_idr || 0),
      0
    ) || 0;

  // total omzet bulan ini
  const { data: monthPayments } = await supabase
    .from("payments")
    .select("amount_idr")
    .eq("status", "confirmed")
    .gte("created_at", monthStart.toISOString());

  const monthTotal =
    monthPayments?.reduce(
      (sum, p: { amount_idr: number }) => sum + (p.amount_idr || 0),
      0
    ) || 0;

  // jumlah pending
  const { count: pendingCount } = await supabase
    .from("payments")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  // jumlah confirmed
  const { count: confirmedCount } = await supabase
    .from("payments")
    .select("*", { count: "exact", head: true })
    .eq("status", "confirmed");

  // jumlah premium aktif
  const { count: activePremium } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  // ====== RIWAYAT PEMBAYARAN (A2) ======

  // filter status: all | pending | confirmed | rejected
  // filter status: all | pending | confirmed | rejected
  const rawStatus = sp.status;
  const allowedStatus = ["all", "pending", "confirmed", "rejected"] as const;
  type StatusFilter = (typeof allowedStatus)[number];

  let status: StatusFilter = "all";

  if (typeof rawStatus === "string") {
    const normalized = rawStatus.toLowerCase();
    if (allowedStatus.includes(normalized as StatusFilter)) {
      status = normalized as StatusFilter;
    }
  }

  // pagination
  const rawPage = sp.page;
  const page =
    typeof rawPage === "string" ? Math.max(1, Number(rawPage) || 1) : 1;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let paymentsQuery = supabase
    .from("payments")
    .select(
      `
      id,
      user_id,
      amount_idr,
      status,
      method,
      created_at,
      subscription_plans (
        name
      )
    `
    )
    .order("created_at", { ascending: false });

  if (status !== "all") {
    paymentsQuery = paymentsQuery.eq("status", status);
  }

  const { data: paymentRows, error: paymentsError } = await paymentsQuery
    .range(from, to)
    .returns<PaymentRow[]>();

  if (paymentsError) {
    console.error("Error fetching payments history:", paymentsError);
  }

  const payments: PaymentRow[] = paymentRows || [];
  const hasNextPage = payments.length === PAGE_SIZE;
  const hasPrevPage = page > 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Dashboard Keuangan 📊
        </h1>
        <p className="mt-1 text-xs text-slate-600">
          Lihat ringkasan pemasukan dan riwayat pembayaran siswa.
        </p>
      </div>

      {/* Ringkasan Kartu */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card title="Omzet Hari Ini" value={rupiah(todayTotal)} />
        <Card title="Omzet Bulan Ini" value={rupiah(monthTotal)} />
        <Card title="Payment Pending" value={pendingCount || 0} />
        <Card title="Payment Confirmed" value={confirmedCount || 0} />
        <Card title="Premium Aktif" value={activePremium || 0} />
      </div>

      {/* Riwayat Pembayaran */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Riwayat Pembayaran 💰
            </h2>
            <p className="text-[11px] text-slate-7000">
              Lihat semua permintaan upgrade dan pembayaran yang sudah
              dikonfirmasi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            {/* Filter status */}
            <div className="flex flex-wrap gap-2">
              {["all", "pending", "confirmed", "rejected"].map((s) => (
                <FilterChip
                  key={s}
                  label={
                    s === "all"
                      ? "Semua"
                      : s === "pending"
                      ? "Pending"
                      : s === "confirmed"
                      ? "Confirmed"
                      : "Rejected"
                  }
                  active={status === s}
                  href={`/dashboard/admin/finance?status=${s}`}
                />
              ))}
            </div>

            {/* Tombol export CSV */}
            <a
              href={`/api/adm/finance/export?status=${status}`}
              className="rounded-full border border-emerald-600 bg-emerald-600 px-3 py-1 font-semibold text-white hover:bg-emerald-700"
            >
              Export CSV
            </a>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
            Belum ada data pembayaran untuk filter ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-white">
                  <th className="px-2 py-2 text-left font-semibold text-slate-600">
                    Tanggal
                  </th>
                  <th className="px-2 py-2 text-left font-semibold text-slate-600">
                    User ID
                  </th>
                  <th className="px-2 py-2 text-left font-semibold text-slate-600">
                    Paket
                  </th>
                  <th className="px-2 py-2 text-right font-semibold text-slate-600">
                    Nominal
                  </th>
                  <th className="px-2 py-2 text-center font-semibold text-slate-600">
                    Status
                  </th>
                  <th className="px-2 py-2 text-center font-semibold text-slate-600">
                    Metode
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-slate-200 hover:bg-slate-50/60"
                  >
                    <td className="px-2 py-2 align-top">
                      {new Date(p.created_at).toLocaleString("id-ID")}
                    </td>
                    <td className="px-2 py-2 align-top font-mono text-[11px] text-slate-600">
                      {p.user_id.slice(0, 8)}...
                    </td>
                    <td className="px-2 py-2 align-top">
                      {p.subscription_plans?.name ?? "-"}
                    </td>
                    <td className="px-2 py-2 align-top text-right font-semibold">
                      {rupiah(p.amount_idr || 0)}
                    </td>
                    <td className="px-2 py-2 align-top text-center">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-2 py-2 align-top text-center text-slate-600">
                      {p.method || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination sederhana */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-600">
          <div>
            Halaman <span className="font-semibold">{page}</span>
            {status !== "all" && (
              <span className="ml-1">
                (filter:{" "}
                <span className="font-semibold">
                  {status === "pending"
                    ? "Pending"
                    : status === "confirmed"
                    ? "Confirmed"
                    : status === "rejected"
                    ? "Rejected"
                    : "Semua"}
                </span>
                )
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {hasPrevPage ? (
              <Link
                href={`/dashboard/admin/finance?status=${status}&page=${
                  page - 1
                }`}
                prefetch={false}
                className="rounded-full border border-slate-200 px-3 py-1 hover:bg-slate-50"
              >
                ⬅️ Sebelumnya
              </Link>
            ) : (
              <span className="rounded-full border border-slate-200 px-3 py-1 text-slate-600">
                ⬅️ Sebelumnya
              </span>
            )}
            {hasNextPage ? (
              <Link
                href={`/dashboard/admin/finance?status=${status}&page=${
                  page + 1
                }`}
                prefetch={false}
                className="rounded-full border border-slate-200 px-3 py-1 hover:bg-slate-50"
              >
                Berikutnya ➜
              </Link>
            ) : (
              <span className="rounded-full border border-slate-200 px-3 py-1 text-slate-600">
                Berikutnya ➜
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow">
      <div className="text-xs text-slate-7000 mb-1">{title}</div>
      <div className="text-lg font-bold text-slate-900">{value}</div>
    </div>
  );
}

function rupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "pending") {
    return (
      <span className="rounded-full bg-yellow-100 px-2 py-1 text-[11px] font-semibold text-yellow-700">
        Pending
      </span>
    );
  }
  if (s === "confirmed") {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-600">
        Confirmed
      </span>
    );
  }
  if (s === "rejected") {
    return (
      <span className="rounded-full bg-rose-100 px-2 py-1 text-[11px] font-semibold text-rose-700">
        Rejected
      </span>
    );
  }
  return (
    <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-900">
      {status}
    </span>
  );
}

function FilterChip({
  label,
  active,
  href,
}: {
  label: string;
  active: boolean;
  href: string;
}) {
  if (active) {
    return (
      <span className="rounded-full border border-cyan-600 bg-cyan-600 px-3 py-1 font-semibold text-white">
        {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-full border border-slate-200 px-3 py-1 text-slate-700 hover:border-cyan-400 hover:text-cyan-700"
    >
      {label}
    </Link>
  );
}
