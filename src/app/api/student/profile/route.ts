import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function PATCH(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthenticated" }, { status: 401 });
  }

  let body: { fullName?: string; phone?: string } = {};
  try {
    body = (await req.json()) as { fullName?: string };
  } catch {
    return NextResponse.json(
      { ok: false, error: "Payload tidak valid." },
      { status: 400 }
    );
  }

  const fullName = body.fullName?.trim();
  const phoneRaw = body.phone?.trim() ?? "";
  if (!fullName) {
    return NextResponse.json(
      { ok: false, error: "Nama lengkap wajib diisi." },
      { status: 400 }
    );
  }

  let phone: string | null = null;
  if (phoneRaw) {
    const digits = phoneRaw.replace(/[^0-9]/g, "");
    let rest = "";
    if (digits.startsWith("62")) {
      rest = digits.slice(2);
    } else if (digits.startsWith("0")) {
      rest = digits.slice(1);
    } else if (digits.startsWith("8")) {
      rest = digits;
    } else {
      return NextResponse.json(
        { ok: false, error: "Gunakan format nomor Indonesia (08xx / 62xx)." },
        { status: 400 }
      );
    }

    const normalized = `+62${rest}`;
    const isValid = /^\+62[0-9]{8,12}$/.test(normalized);
    if (!isValid) {
      return NextResponse.json(
        { ok: false, error: "Nomor HP tidak valid." },
        { status: 400 }
      );
    }
    phone = normalized;
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone })
    .eq("id", user.id);

  if (error) {
    console.error("profile update error:", error);
    return NextResponse.json(
      { ok: false, error: "Gagal memperbarui profil." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
