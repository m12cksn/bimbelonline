import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function getBucketName() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ||
    process.env.SUPABASE_STORAGE_BUCKET ||
    "question-assets"
  );
}

export async function POST(req: Request) {
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
    .maybeSingle();

  if (profile?.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { ok: false, error: "Service role key tidak tersedia" },
      { status: 500 },
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const level = Number(formData.get("level"));

  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return NextResponse.json(
      { ok: false, error: "Pilih file gambar yang valid" },
      { status: 400 },
    );
  }
  if (!Number.isInteger(level) || level < 1 || level > 12) {
    return NextResponse.json(
      { ok: false, error: "Tingkat kelas tidak valid" },
      { status: 400 },
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { ok: false, error: "Ukuran gambar maksimal 5 MB" },
      { status: 400 },
    );
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const path = `grade-cards/class-${level}-${Date.now()}-${safeName}`;
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { error: uploadError } = await serviceClient.storage
    .from(getBucketName())
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("grade card image upload error:", uploadError);
    return NextResponse.json(
      { ok: false, error: "Gagal mengunggah gambar" },
      { status: 500 },
    );
  }

  const { data } = serviceClient.storage
    .from(getBucketName())
    .getPublicUrl(path);

  return NextResponse.json({ ok: true, url: data.publicUrl });
}
