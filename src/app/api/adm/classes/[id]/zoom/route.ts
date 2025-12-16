// src/app/api/adm/classes/[id]/zoom/route.ts

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const resolved =
    typeof params === "object" && "then" in params ? await params : params;

  const classId = Number(resolved.id);
  if (Number.isNaN(classId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid class id" },
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

  const { data, error } = await supabase
    .from("class_zoom_sessions")
    .select("id, title, start_time, end_time, zoom_link")
    .eq("class_id", classId)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("list zoom error", error);
    return NextResponse.json(
      { ok: false, error: "Failed fetch zoom" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, sessions: data ?? [] });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const resolved =
    typeof params === "object" && "then" in params ? await params : params;

  const classId = Number(resolved.id);
  if (Number.isNaN(classId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid class id" },
      { status: 400 }
    );
  }

  const body = (await req.json()) as {
    title?: string;
    start_time?: string;
    end_time?: string;
    zoom_link?: string;
  };

  if (!body.start_time || !body.end_time || !body.zoom_link) {
    return NextResponse.json(
      { ok: false, error: "start_time, end_time, zoom_link wajib diisi" },
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

  const { error } = await supabase.from("class_zoom_sessions").insert({
    class_id: classId,
    title: body.title ?? "Sesi Zoom",
    start_time: body.start_time,
    end_time: body.end_time,
    zoom_link: body.zoom_link,
    created_by: user.id,
  });

  if (error) {
    console.error("create zoom error", error);
    return NextResponse.json(
      { ok: false, error: "Failed create zoom" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
