import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

/*
   Response:
   {
     ok: true,
     subscriptions: [
       { id, user_id, start_at, end_at, plan_id, status }
     ]
   }
*/

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user ?? null;

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    // cek role admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // SESUAIKAN DENGAN STRUKTUR TABEL KAMU
    const { data, error } = await supabase
      .from("subscriptions")
      .select("id, user_id, start_at, end_at, plan_id, status")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("fetch subscriptions error:", error);
      return NextResponse.json(
        { ok: false, error: "Failed to fetch subscriptions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, subscriptions: data ?? [] });
  } catch (err) {
    console.error("GET /api/subscriptions error:", err);
    return NextResponse.json(
      { ok: false, error: "unexpected error", subscriptions: [] },
      { status: 500 }
    );
  }
}
