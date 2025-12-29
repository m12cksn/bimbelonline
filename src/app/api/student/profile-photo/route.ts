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

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Form data tidak valid." },
      { status: 400 }
    );
  }

  const file = formData.get("file");
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
  const path = `profiles/${user.id}/avatar-${Date.now()}-${safeName}`;

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = getBucketName();
  const uploader = serviceKey
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : supabase;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await uploader.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error("Profile photo upload error:", uploadError);
    return NextResponse.json(
      { ok: false, error: "Gagal upload foto profil" },
      { status: 500 }
    );
  }

  const { data } = uploader.storage.from(bucket).getPublicUrl(path);
  const avatarUrl = data.publicUrl;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (updateError) {
    console.error("Profile photo update error:", updateError);
    return NextResponse.json(
      { ok: false, error: "Gagal menyimpan foto profil" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, url: avatarUrl });
}
