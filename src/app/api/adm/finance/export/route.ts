// app/api/adm/finance/export/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

type PaymentExportRow = {
  id: string;
  user_id: string;
  amount_idr: number;
  status: string;
  method: string | null;
  created_at: string;
  subscription_plans: {
    name: string | null;
    code: string | null;
  } | null;
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status") || "all";
  const monthParam = url.searchParams.get("month"); // format "2025-12" (opsional)

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // ignore error
          }
        },
      },
    }
  );

  // cek user login
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // cek role admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // optional filter bulan
  let monthStartIso: string | null = null;
  let monthEndIso: string | null = null;

  if (monthParam) {
    // eks: "2025-12"
    const [yStr, mStr] = monthParam.split("-");
    const year = Number(yStr);
    const month = Number(mStr);

    if (
      !Number.isNaN(year) &&
      !Number.isNaN(month) &&
      month >= 1 &&
      month <= 12
    ) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1); // awal bulan berikutnya
      monthStartIso = start.toISOString();
      monthEndIso = end.toISOString();
    }
  }

  // query payments
  let query = supabase
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
        name,
        code
      ),
      profiles (
        full_name,
        email
      )
    `
    )
    .order("created_at", { ascending: true });

  if (statusParam !== "all") {
    query = query.eq("status", statusParam);
  }

  if (monthStartIso && monthEndIso) {
    query = query
      .gte("created_at", monthStartIso)
      .lt("created_at", monthEndIso);
  }

  const { data, error } = await query.returns<PaymentExportRow[]>();

  if (error) {
    console.error("Export payments error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pembayaran" },
      { status: 500 }
    );
  }

  const rows: PaymentExportRow[] = data || [];

  // buat CSV
  const header = [
    "id",
    "created_at",
    "user_id",
    "user_name",
    "user_email",
    "plan_name",
    "plan_code",
    "amount_idr",
    "status",
    "method",
  ];

  const csvLines: string[] = [];
  csvLines.push(header.join(","));

  function csvEscape(value: string | number | null): string {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      // escape dengan tanda kutip ganda
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  rows.forEach((row) => {
    const line = [
      csvEscape(row.id),
      csvEscape(new Date(row.created_at).toISOString()),
      csvEscape(row.user_id),
      csvEscape(row.profiles?.full_name ?? ""),
      csvEscape(row.profiles?.email ?? ""),
      csvEscape(row.subscription_plans?.name ?? ""),
      csvEscape(row.subscription_plans?.code ?? ""),
      csvEscape(row.amount_idr || 0),
      csvEscape(row.status),
      csvEscape(row.method ?? ""),
    ].join(",");

    csvLines.push(line);
  });

  const csvContent = csvLines.join("\r\n");

  const fileNameParts = ["payments"];
  if (monthParam) fileNameParts.push(monthParam);
  if (statusParam && statusParam !== "all") fileNameParts.push(statusParam);
  const fileName = `${fileNameParts.join("-")}.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
