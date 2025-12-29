import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("payments")
    .select(
      "id, amount_idr, status, created_at, subscription_plans ( name )"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("payments history error:", error);
    return NextResponse.json(
      { ok: false, error: "Gagal memuat riwayat pembayaran" },
      { status: 500 }
    );
  }

  const items = (data ?? []).map((row) => {
    const raw = row as Record<string, unknown>;
    const planValue = raw.subscription_plans;
    const planObj = Array.isArray(planValue)
      ? (planValue[0] as Record<string, unknown> | undefined) ?? null
      : (planValue as Record<string, unknown> | null);

    return {
      id: raw.id,
      amount: raw.amount_idr,
      status: raw.status,
      createdAt: raw.created_at,
      planName: typeof planObj?.name === "string" ? planObj.name : null,
    };
  });

  return NextResponse.json({ ok: true, items });
}
