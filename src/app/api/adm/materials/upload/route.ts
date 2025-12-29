import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

const MAX_FILE_SIZE_MB = 5;

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

  if (!profile || profile.role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { ok: false, error: "Service role key tidak tersedia" },
      { status: 500 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const materialId = String(formData.get("materialId") ?? "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "File tidak valid" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return NextResponse.json(
      { ok: false, error: "Ukuran file terlalu besar" },
      { status: 400 }
    );
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const prefix = materialId ? `materials/${materialId}` : "materials/draft";
  const path = `${prefix}/cover-${Date.now()}-${safeName}`;

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const buffer = Buffer.from(await file.arrayBuffer());
  const bucket = getBucketName();

  const { error: uploadError } = await serviceClient.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Material upload error:", uploadError);
    return NextResponse.json(
      { ok: false, error: "Gagal upload ke storage" },
      { status: 500 }
    );
  }

  const { data } = serviceClient.storage.from(bucket).getPublicUrl(path);

  return NextResponse.json({ ok: true, url: data.publicUrl });
}
