// app/api/adm/payments/[id]/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

interface Params {
  params: Promise<{ id: string }>;
}

type PaymentWithPlan = {
  id: string;
  user_id: string;
  plan_id: string;
  amount_idr: number;
  status: string;
  subscription_plans:
    | { duration_days: number | null }
    | { duration_days: number | null }[]
    | null;
};

export async function POST(req: Request, props: Params) {
  const { id } = await props.params;

  const formData = await req.formData();
  const action = formData.get("action");

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
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

  // cek role admin (opsional tapi bagus)
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!adminProfile || adminProfile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ambil payment + relasi plan
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select(
      `
      id,
      user_id,
      plan_id,
      amount_idr,
      status,
      subscription_plans (
        duration_days
      )
    `
    )
    .eq("id", id)
    .single<PaymentWithPlan>();

  if (paymentError || !payment) {
    return NextResponse.json(
      { error: "Payment tidak ditemukan" },
      { status: 404 }
    );
  }

  // ============= REJECT =============
  // ============= REJECT =============
  if (action === "reject") {
    // 1) update payment → rejected
    const { error: rejectError } = await supabase
      .from("payments")
      .update({ status: "rejected" })
      .eq("id", id);

    if (rejectError) {
      console.error("Reject update error:", rejectError);
      return NextResponse.json(
        { error: "Gagal mengubah status menjadi rejected" },
        { status: 500 }
      );
    }

    // 2) opsional: kalau ada subscription active yang terhubung payment ini, tandai expired
    await supabase
      .from("subscriptions")
      .update({ status: "expired" })
      .eq("payment_id", payment.id)
      .eq("user_id", payment.user_id)
      .eq("status", "active");

    // 3) sinkron ke profiles.is_premium → pastikan balik ke false
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({ is_premium: false })
      .eq("id", payment.user_id);

    if (profileUpdateError) {
      console.error(
        "Profile is_premium update error (reject):",
        profileUpdateError
      );
      // tidak perlu return error, karena penolakan payment sudah diproses
    }

    return NextResponse.redirect(
      new URL("/dashboard/admin/payments?rejected=1", req.url)
    );
  }

  // ============= APPROVE =============
  // Ambil duration_days dari relasi (bisa array atau object)
  const rel = payment.subscription_plans;
  let durationDays = 30;

  if (Array.isArray(rel)) {
    if (rel.length > 0 && typeof rel[0]?.duration_days === "number") {
      durationDays = rel[0].duration_days ?? 30;
    }
  } else if (rel && typeof rel.duration_days === "number") {
    durationDays = rel.duration_days ?? 30;
  }

  const startAt = new Date();
  const endAt = new Date();
  endAt.setDate(endAt.getDate() + durationDays);

  // 1) optional: matikan semua subscription active lama untuk user ini
  await supabase
    .from("subscriptions")
    .update({ status: "expired" })
    .eq("user_id", payment.user_id)
    .eq("status", "active");

  // 2) update payment → confirmed
  const { error: confirmError } = await supabase
    .from("payments")
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      confirmed_by: user.id,
    })
    .eq("id", id);

  if (confirmError) {
    console.error("Confirm update error:", confirmError);
    return NextResponse.json(
      { error: "Gagal mengubah status menjadi confirmed" },
      { status: 500 }
    );
  }

  // 3) insert subscription active
  const { error: subError } = await supabase.from("subscriptions").insert({
    user_id: payment.user_id,
    plan_id: payment.plan_id,
    payment_id: payment.id,
    status: "active",
    start_at: startAt.toISOString(),
    end_at: endAt.toISOString(),
  });

  if (subError) {
    console.error("Subscription insert error:", subError);
    return NextResponse.json(
      { error: "Gagal membuat subscription" },
      { status: 500 }
    );
  }

  // 4) ✅ sinkron ke profiles.is_premium → ini yang dipakai dashboard guru
  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update({ is_premium: true })
    .eq("id", payment.user_id);

  if (profileUpdateError) {
    console.error("Profile is_premium update error:", profileUpdateError);
    // tidak usah di-return error, karena subscription sudah terbuat
  }

  return NextResponse.redirect(
    new URL("/dashboard/admin/payments?approved=1", req.url)
  );
}
