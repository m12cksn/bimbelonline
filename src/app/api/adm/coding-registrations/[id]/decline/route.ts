import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("coding_registrations")
    .update({ status: "declined" })
    .eq("id", id);

  if (error) {
    console.error("coding decline error", error);
    return NextResponse.json({ ok: false, error: "Gagal decline." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
