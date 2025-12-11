// app/api/student/payments/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

type PlanRow = {
  id: string;
  price_idr: number;
  is_active: boolean;
};

type SimpleIdRow = { id: string };

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json(
        { error: "planId wajib diisi" },
        { status: 400 }
      );
    }

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
              // ignore
            }
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const nowIso = new Date().toISOString();

    // ✅ 1. Cek: user sudah PUNYA subscription aktif?
    const { data: activeSub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .lte("start_at", nowIso)
      .gte("end_at", nowIso)
      .limit(1)
      .maybeSingle<SimpleIdRow>();

    if (activeSub) {
      return NextResponse.json(
        {
          error: "Akun kamu sudah Premium.",
          code: "ALREADY_PREMIUM",
        },
        { status: 400 }
      );
    }

    // ✅ 2. Cek: sudah ada payment pending?
    const { data: pendingPayment } = await supabase
      .from("payments")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .limit(1)
      .maybeSingle<SimpleIdRow>();

    if (pendingPayment) {
      return NextResponse.json(
        {
          error:
            "Permintaan upgrade sudah dikirim. Silakan tunggu admin memberi respon ya.",
          code: "PENDING_EXISTS",
        },
        { status: 400 }
      );
    }

    // ✅ 3. Cek plan
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("id, price_idr, is_active")
      .eq("id", planId)
      .eq("is_active", true)
      .single<PlanRow>();

    if (planError || !plan) {
      return NextResponse.json(
        { error: "Paket tidak ditemukan atau tidak aktif" },
        { status: 400 }
      );
    }

    // ✅ 4. Insert payment baru (status: pending)
    const { error: insertError } = await supabase.from("payments").insert({
      user_id: user.id,
      plan_id: plan.id,
      amount_idr: plan.price_idr,
      method: "manual_transfer",
      status: "pending",
    });

    if (insertError) {
      console.error("Insert payment error:", insertError);
      return NextResponse.json(
        { error: "Gagal membuat permintaan pembayaran" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("API /student/payments error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
