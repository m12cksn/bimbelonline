import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { randomBytes } from "crypto";

type CreateStudentPayload = {
  username?: string;
  email?: string;
  password?: string;
  fullName?: string;
  learningTrack?: "math" | "coding";
  gradeIds?: number[];
};

function normalizeBase(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function randomDigits(count: number) {
  const max = 10 ** count;
  const num = Math.floor(Math.random() * max);
  return String(num).padStart(count, "0");
}

function generateUsername(fullName: string, learningTrack: "math" | "coding") {
  const base = normalizeBase(fullName).slice(0, 10) || "siswa";
  const prefix = learningTrack === "coding" ? "c" : "m";
  return `${prefix}${base}${randomDigits(3)}`;
}

function generatePassword() {
  return randomDigits(6);
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

  const body = (await req.json()) as CreateStudentPayload;
  const inputUsername = String(body.username ?? "").trim().toLowerCase();
  const inputEmail = String(body.email ?? "").trim().toLowerCase();
  const inputPassword = String(body.password ?? "").trim();
  const fullName = String(body.fullName ?? "").trim();
  const learningTrack = body.learningTrack ?? "math";
  const gradeIds = Array.isArray(body.gradeIds)
    ? body.gradeIds.filter((id) => typeof id === "number" && Number.isFinite(id))
    : [];

  if (!fullName) {
    return NextResponse.json(
      { ok: false, error: "Nama siswa wajib diisi" },
      { status: 400 }
    );
  }

  if (gradeIds.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Minimal satu grade wajib dipilih" },
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

  let username = inputUsername;
  let email = inputEmail;
  let password = inputPassword;

  if (!username || !email || !password) {
    let attempts = 0;
    while (attempts < 5) {
      const candidate = generateUsername(fullName, learningTrack);
      const { data: existingUsername } = await adminClient
        .from("profiles")
        .select("id")
        .eq("username", candidate)
        .maybeSingle();

      if (!existingUsername) {
        username = candidate;
        break;
      }
      attempts += 1;
    }

    if (!username) {
      return NextResponse.json(
        { ok: false, error: "Gagal membuat username unik" },
        { status: 500 }
      );
    }

    if (!email) {
      email = `${username}@student.bimbel.local`;
    }

    if (!password) {
      password = generatePassword();
    }
  }

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

  if (password.length < 6) {
    return NextResponse.json(
      { ok: false, error: "Password minimal 6 karakter" },
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

  const gradeRows = gradeIds.map((gradeId) => ({
    student_id: createdUser.user.id,
    grade_id: gradeId,
  }));

  const { error: gradeError } = await adminClient
    .from("student_grades")
    .upsert(gradeRows, {
      onConflict: "student_id,grade_id",
    });

  if (gradeError) {
    console.error("student_grades upsert error", gradeError);
    return NextResponse.json(
      { ok: false, error: "Gagal menyimpan grade siswa" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    user: { id: createdUser.user.id, email, username, password },
  });
}
