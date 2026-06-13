import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { mergeGradeCards } from "@/lib/gradeCards";

async function getAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, isAdmin: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return { supabase, user, isAdmin: profile?.role === "admin" };
}

export async function GET() {
  const { supabase, user, isAdmin } = await getAdmin();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });
  }
  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("grades")
    .select("id, level, name, description, image_url")
    .order("level", { ascending: true });

  if (error) {
    const { data: basicRows, error: basicError } = await supabase
      .from("grades")
      .select("id, level, name")
      .order("level", { ascending: true });

    if (basicError) {
      return NextResponse.json(
        { ok: false, error: "Gagal mengambil data kelas" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      cards: mergeGradeCards(basicRows),
      setupRequired: true,
    });
  }

  return NextResponse.json({
    ok: true,
    cards: mergeGradeCards(data),
    setupRequired: false,
  });
}

export async function PUT(req: Request) {
  const { supabase, user, isAdmin } = await getAdmin();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });
  }
  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as {
    level?: number;
    name?: string;
    description?: string;
    imageUrl?: string;
  };

  const level = Number(body.level);
  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "").trim();
  const imageUrl = String(body.imageUrl ?? "").trim();

  if (!Number.isInteger(level) || level < 1 || level > 12 || !name) {
    return NextResponse.json(
      { ok: false, error: "Kelas dan nama kelas tidak valid" },
      { status: 400 },
    );
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const updater = serviceKey
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : supabase;

  const { data: existing, error: lookupError } = await updater
    .from("grades")
    .select("id")
    .eq("level", level)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Kolom konfigurasi kartu kelas belum tersedia. Jalankan migrasi grade-cards terlebih dahulu.",
        setupRequired: true,
      },
      { status: 409 },
    );
  }

  const payload = {
    level,
    name,
    description: description || null,
    image_url: imageUrl || null,
  };

  const result = existing?.id
    ? await updater.from("grades").update(payload).eq("id", existing.id)
    : await updater.from("grades").insert(payload);

  if (result.error) {
    console.error("grade card update error:", result.error);
    return NextResponse.json(
      {
        ok: false,
        error:
          "Gagal menyimpan kartu kelas. Pastikan migrasi database sudah dijalankan.",
        setupRequired: true,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
