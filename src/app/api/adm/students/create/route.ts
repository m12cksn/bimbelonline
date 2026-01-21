import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type CreateStudentPayload = {
  username?: string;
  email?: string;
  password?: string;
  fullName?: string;
  learningTrack?: "math" | "coding";
};

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

  const body = (await req.json()) as CreateStudentPayload;
  const username = String(body.username ?? "").trim().toLowerCase();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "").trim();
  const fullName = String(body.fullName ?? "").trim();
  const learningTrack = body.learningTrack ?? "math";

  if (!username || !email || !password) {
    return NextResponse.json(
      { ok: false, error: "Username, email, dan password wajib diisi" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { ok: false, error: "Password minimal 6 karakter" },
      { status: 400 }
    );
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY belum diset" },
      { status: 500 }
    );
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: existingUsername } = await adminClient
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existingUsername) {
    return NextResponse.json(
      { ok: false, error: "Username sudah dipakai" },
      { status: 400 }
    );
  }

  const { data: existingEmail } = await adminClient
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingEmail) {
    return NextResponse.json(
      { ok: false, error: "Email sudah dipakai" },
      { status: 400 }
    );
  }

  const { data: createdUser, error: createError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: "student" },
    });

  if (createError || !createdUser?.user) {
    console.error("create user error", createError);
    return NextResponse.json(
      { ok: false, error: "Gagal membuat akun" },
      { status: 500 }
    );
  }

  const { error: profileError } = await adminClient.from("profiles").upsert(
    {
      id: createdUser.user.id,
      full_name: fullName || null,
      email,
      username,
      role: "student",
      is_premium: false,
      learning_track: learningTrack,
    },
    { onConflict: "id" }
  );

  if (profileError) {
    console.error("profile upsert error", profileError);
    return NextResponse.json(
      { ok: false, error: "Gagal menyimpan profil" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    user: { id: createdUser.user.id, email, username },
  });
}
