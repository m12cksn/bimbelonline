import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

const PACKAGES = {
  CODING_15: {
    name: "Paket 15 Kelas",
    sessions: 15,
    priceIdr: 1500000,
  },
  CODING_30: {
    name: "Paket 30 Kelas",
    sessions: 30,
    priceIdr: 2800000,
  },
} as const;

type PackageCode = keyof typeof PACKAGES;

const MAX_PROOF_SIZE_MB = 5;

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

  const contentType = req.headers.get("content-type") ?? "";
  let fullName = "";
  let phone = "";
  let notes: string | null = null;
  let packageCode = "" as PackageCode;
  let hasPaid = false;
  let proofFile: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    fullName = String(form.get("fullName") ?? "").trim();
    phone = String(form.get("phone") ?? "").trim();
    notes = String(form.get("notes") ?? "").trim() || null;
    packageCode = String(form.get("packageCode") ?? "") as PackageCode;
    hasPaid = String(form.get("hasPaid") ?? "").toLowerCase() === "true";
    const proof = form.get("proof");
    if (proof instanceof File) {
      proofFile = proof;
    }
  } else {
    const body = (await req.json()) as {
      fullName?: string;
      phone?: string;
      notes?: string | null;
      packageCode?: string;
      hasPaid?: boolean;
    };
    fullName = (body.fullName ?? "").trim();
    phone = (body.phone ?? "").trim();
    notes = body.notes ?? null;
    packageCode = (body.packageCode ?? "") as PackageCode;
    hasPaid = Boolean(body.hasPaid);
  }

  if (!fullName || !phone) {
    return NextResponse.json({ ok: false, error: "Nama dan WhatsApp wajib diisi." }, { status: 400 });
  }

  if (!PACKAGES[packageCode]) {
    return NextResponse.json({ ok: false, error: "Paket tidak valid." }, { status: 400 });
  }

  const selected = PACKAGES[packageCode];
  let proofUrl: string | null = null;
  let paymentStatus = hasPaid ? "paid" : "unpaid";
  let paidAt: string | null = hasPaid ? new Date().toISOString() : null;

  if (proofFile) {
    if (proofFile.size > MAX_PROOF_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: "Ukuran bukti transfer terlalu besar (max 5MB)." },
        { status: 400 }
      );
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json(
        { ok: false, error: "Service role key tidak tersedia." },
        { status: 500 }
      );
    }

    const safeName = proofFile.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const path = `payments/coding/${user.id}/proof-${Date.now()}-${safeName}`;

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const buffer = Buffer.from(await proofFile.arrayBuffer());
    const bucket = getBucketName();
    const { error: uploadError } = await serviceClient.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: proofFile.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("coding proof upload error:", uploadError);
      return NextResponse.json(
        { ok: false, error: "Gagal mengunggah bukti transfer." },
        { status: 500 }
      );
    }

    const { data } = serviceClient.storage.from(bucket).getPublicUrl(path);
    proofUrl = data.publicUrl;
    if (!hasPaid) {
      paymentStatus = "pending";
    }
  }

  const { error: insertError } = await supabase.from("coding_registrations").insert({
    user_id: user.id,
    full_name: fullName,
    phone,
    package_code: packageCode,
    package_name: selected.name,
    total_sessions: selected.sessions,
    price_idr: selected.priceIdr,
    status: "pending",
    notes,
    payment_status: paymentStatus,
    payment_proof_url: proofUrl,
    paid_at: paidAt,
  });

  if (insertError) {
    console.error("coding registration error:", insertError);
    return NextResponse.json({ ok: false, error: "Gagal menyimpan pendaftaran." }, { status: 500 });
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ learning_track: "coding" })
    .eq("id", user.id);

  if (profileError) {
    console.warn("learning track update error:", profileError);
  }

  return NextResponse.json({ ok: true });
}
