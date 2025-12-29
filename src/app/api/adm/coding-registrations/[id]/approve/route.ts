import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type RegistrationRow = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  package_code: string;
  package_name: string;
  total_sessions: number;
  price_idr: number;
  status: string;
};

type PlanRow = {
  id: string;
};

type SubscriptionRow = {
  id: string;
  start_at: string | null;
  end_at: string | null;
};

type ClassRow = {
  id: number;
};

function formatPhoneToWa(phoneRaw: string) {
  const digits = phoneRaw.replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

function buildWaLink(phoneRaw: string, message: string) {
  const phone = formatPhoneToWa(phoneRaw);
  if (!phone) return "";
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encoded}`;
}

function planDefaults(totalSessions: number) {
  const normalized = totalSessions >= 30 ? 30 : 15;
  return { normalized, durationDays: 36500 };
}

function getUnlimitedEndAt() {
  return new Date("2099-12-31T23:59:59.000Z");
}

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
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
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { data: registration, error: regErr } = await supabase
    .from("coding_registrations")
    .select(
      "id, user_id, full_name, phone, package_code, package_name, total_sessions, price_idr, status"
    )
    .eq("id", id)
    .single<RegistrationRow>();

  if (regErr || !registration) {
    console.error("coding approve fetch error", regErr);
    return NextResponse.json(
      { ok: false, error: "Data pendaftaran tidak ditemukan." },
      { status: 404 }
    );
  }

  const { normalized, durationDays } = planDefaults(
    registration.total_sessions
  );
  const planCode = `CODING_${normalized}`;
  const planName = `Coding ${normalized} Kelas`;
  const planDescription =
    normalized === 30
      ? "Paket coding intensif 30 pertemuan (berlaku selama kuota tersedia)."
      : "Paket coding 15 pertemuan (berlaku selama kuota tersedia).";

  const { data: existingPlan, error: planErr } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("code", planCode)
    .maybeSingle<PlanRow>();

  if (planErr) {
    console.error("coding approve plan fetch error", planErr);
    return NextResponse.json(
      { ok: false, error: "Gagal cek paket coding." },
      { status: 500 }
    );
  }

  let planId = existingPlan?.id ?? null;
  if (!planId) {
    const { data: newPlan, error: createPlanErr } = await supabase
      .from("subscription_plans")
      .insert({
        name: planName,
        code: planCode,
        description: planDescription,
        duration_days: durationDays,
        price_idr: registration.price_idr,
        is_active: true,
        zoom_sessions_per_month: normalized,
      })
      .select("id")
      .single<PlanRow>();

    if (createPlanErr || !newPlan) {
      console.error("coding approve plan create error", createPlanErr);
      return NextResponse.json(
        { ok: false, error: "Gagal membuat paket coding." },
        { status: 500 }
      );
    }
    planId = newPlan.id;
  }

  const { data: existingSub, error: subFetchErr } = await supabase
    .from("subscriptions")
    .select("id, start_at, end_at")
    .eq("user_id", registration.user_id)
    .eq("plan_id", planId)
    .eq("status", "active")
    .order("start_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<SubscriptionRow>();

  if (subFetchErr) {
    console.error("coding approve subscription fetch error", subFetchErr);
    return NextResponse.json(
      { ok: false, error: "Gagal cek subscription coding." },
      { status: 500 }
    );
  }

  let subscriptionId = existingSub?.id ?? null;
  let startAt = existingSub?.start_at ?? null;
  let endAt = existingSub?.end_at ?? null;

  if (!subscriptionId) {
    const now = new Date();
    startAt = now.toISOString();
    endAt = getUnlimitedEndAt().toISOString();

    const { data: newSub, error: subErr } = await supabase
      .from("subscriptions")
      .insert({
        user_id: registration.user_id,
        plan_id: planId,
        status: "active",
        start_at: startAt,
        end_at: endAt,
      })
      .select("id, start_at, end_at")
      .single<SubscriptionRow>();

    if (subErr || !newSub) {
      console.error("coding approve subscription error", subErr);
      return NextResponse.json(
        { ok: false, error: "Gagal membuat subscription coding." },
        { status: 500 }
      );
    }
    subscriptionId = newSub.id;
    startAt = newSub.start_at;
    endAt = newSub.end_at;
  }

  const { data: existingClass, error: classErr } = await supabase
    .from("classes")
    .select("id")
    .eq("subject", "Coding")
    .eq("grade", 4)
    .limit(1)
    .maybeSingle<ClassRow>();

  if (classErr) {
    console.error("coding approve class fetch error", classErr);
    return NextResponse.json(
      { ok: false, error: "Gagal cek kelas coding." },
      { status: 500 }
    );
  }

  let classId = existingClass?.id ?? null;
  if (!classId) {
    const { data: newClass, error: newClassErr } = await supabase
      .from("classes")
      .insert({
        name: "Coding Kelas 4",
        subject: "Coding",
        grade: 4,
        description: "Kelas coding untuk siswa kelas 4.",
      })
      .select("id")
      .single<ClassRow>();

    if (newClassErr || !newClass) {
      console.error("coding approve class create error", newClassErr);
      return NextResponse.json(
        { ok: false, error: "Gagal membuat kelas coding." },
        { status: 500 }
      );
    }
    classId = newClass.id;
  }

  const { data: existingClassStudent, error: classStudentErr } = await supabase
    .from("class_students")
    .select("id")
    .eq("class_id", classId)
    .eq("student_id", registration.user_id)
    .maybeSingle();

  if (classStudentErr) {
    console.error("coding approve class_students fetch error", classStudentErr);
    return NextResponse.json(
      { ok: false, error: "Gagal cek data kelas siswa." },
      { status: 500 }
    );
  }

  if (!existingClassStudent) {
    const { error: insertClassStudentErr } = await supabase
      .from("class_students")
      .insert({
        class_id: classId,
        student_id: registration.user_id,
        added_by: user.id,
        added_at: new Date().toISOString(),
        start_date: startAt,
        end_date: endAt,
      });

    if (insertClassStudentErr) {
      console.error(
        "coding approve class_students insert error",
        insertClassStudentErr
      );
      return NextResponse.json(
        { ok: false, error: "Gagal menambahkan siswa ke kelas coding." },
        { status: 500 }
      );
    }
  }

  if (subscriptionId && classId) {
    const { error: quotaErr } = await supabase
      .from("class_student_zoom_quota")
      .upsert(
        {
          class_id: classId,
          student_id: registration.user_id,
          subscription_id: subscriptionId,
          period_start: startAt,
          period_end: endAt,
          allowed_sessions: normalized,
          used_sessions: 0,
        },
        { onConflict: "class_id,student_id" }
      );

    if (quotaErr) {
      console.error("coding approve quota upsert error", quotaErr);
      return NextResponse.json(
        { ok: false, error: "Gagal mengatur kuota zoom coding." },
        { status: 500 }
      );
    }
  }

  if (registration.status !== "approved") {
    const { error: statusErr } = await supabase
      .from("coding_registrations")
      .update({ status: "approved" })
      .eq("id", id);

    if (statusErr) {
      console.error("coding approve status error", statusErr);
      return NextResponse.json(
        { ok: false, error: "Gagal update status pendaftaran." },
        { status: 500 }
      );
    }
  }

  const message = `Halo ${registration.full_name}, pendaftaran Coding ${registration.package_name} sudah disetujui ✅\n\nPaket: ${registration.package_name} (${normalized} kelas)\nBiaya: Rp ${registration.price_idr.toLocaleString("id-ID")}\n\nSilakan balas pesan ini untuk konfirmasi jadwal pertama. Terima kasih.`;
  const waLink = buildWaLink(registration.phone, message);

  return NextResponse.json({ ok: true, wa_link: waLink });
}
