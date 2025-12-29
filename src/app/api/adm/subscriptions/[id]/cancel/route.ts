import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

interface CancelParams {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, props: CancelParams) {
  try {
    const { id } = await props.params;
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "subscription id tidak valid" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { data: sub, error: subErr } = await supabase
      .from("subscriptions")
      .select("id, user_id")
      .eq("id", id)
      .single<{ id: string; user_id: string }>();

    if (subErr || !sub) {
      return NextResponse.json(
        { ok: false, error: "Subscription tidak ditemukan" },
        { status: 404 }
      );
    }

    const nowIso = new Date().toISOString();
    const { error: updateErr } = await supabase
      .from("subscriptions")
      .update({ status: "cancelled", end_at: nowIso })
      .eq("id", id);

    if (updateErr) {
      console.error("cancel subscription error:", updateErr);
      return NextResponse.json(
        { ok: false, error: "Gagal mengubah status subscription" },
        { status: 500 }
      );
    }

    const { error: profileUpdateErr } = await supabase
      .from("profiles")
      .update({ is_premium: false })
      .eq("id", sub.user_id);

    if (profileUpdateErr) {
      console.error("update profile premium error:", profileUpdateErr);
    }

    const { error: quotaErr } = await supabase
      .from("class_student_zoom_quota")
      .delete()
      .eq("subscription_id", id);

    if (quotaErr) {
      console.error("delete quota error:", quotaErr);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("cancel subscription fatal:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
