// src/app/api/adm/classes/[id]/zoom/[zoomId]/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function DELETE(
  _req: Request,
  {
    params,
  }: {
    params:
      | { id: string; zoomId: string }
      | Promise<{ id: string; zoomId: string }>;
  }
) {
  const resolved =
    typeof params === "object" && "then" in params ? await params : params;

  const zoomId = Number(resolved.zoomId);
  if (Number.isNaN(zoomId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid zoom id" },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthenticated" },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const { error } = await supabase
    .from("class_zoom_sessions")
    .delete()
    .eq("id", zoomId);

  if (error) {
    console.error("delete zoom error", error);
    return NextResponse.json(
      { ok: false, error: "Failed delete zoom" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
