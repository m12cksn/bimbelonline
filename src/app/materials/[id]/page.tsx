// app/materials/[id]/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { UserRole } from "@/lib/type";
import MaterialWithResources from "./material_client";
import { getUserSubscriptionStatus } from "@/lib/subcription";
import { resolvePlanAccess } from "@/lib/planAccess";

// params: Promise<{ id: string }> -> sesuai file kamu
interface MaterialPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function MaterialPage(props: MaterialPageProps) {
  const { id } = await props.params;
  const resolvedSearchParams = props.searchParams
    ? await props.searchParams
    : undefined;
  const isEmbed = resolvedSearchParams?.embed === "1";

  const materialId = parseInt(id, 10);
  if (Number.isNaN(materialId)) {
    redirect("/dashboard/student");
  }

  const supabase = await createSupabaseServerClient();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 1. cek user login
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isGuest = !user;

  let profile: {
    role?: UserRole | null;
    is_premium?: boolean | null;
    learning_track?: string | null;
  } | null = null;
  let role: UserRole = "student";
  let isAdmin = false;

  if (!isGuest && user) {
    // 2. cek role + is_premium dari profiles
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role, is_premium, learning_track") // 👈 tambahkan is_premium
      .eq("id", user.id)
      .single();

    profile = profileData ?? null;

    if (profileError) {
      console.warn("profiles fetch error", profileError);
    }

    role =
      (profile?.role as UserRole | undefined) ||
      (user.user_metadata?.role as UserRole | undefined) ||
      ((user as any)?.app_metadata?.role as UserRole | undefined) ||
      "student";

    isAdmin = role === "admin";
    if (role !== "student" && role !== "admin") {
      if (role === "teacher") redirect("/dashboard/teacher");
      redirect("/login");
    }
  }

  // ✅ Sumber utama: profiles.is_premium
  let isPremium = profile?.is_premium === true;
  let planName: string | null = null;
  let planCode: string | null = null;

  if (!isGuest) {
    // (Opsional) Tambahan dari sistem subscription; kalau helper bilang premium, paksa true
    try {
      const subStatus = await getUserSubscriptionStatus();
      if (subStatus?.isPremium) {
        isPremium = true;
      }
      planName = subStatus?.planName ?? null;
      planCode = subStatus?.planCode ?? null;
    } catch (e) {
      console.warn("getUserSubscriptionStatus failed", e);
    }
  }

  const planAccess = resolvePlanAccess(planCode, planName, isPremium);
  let questionLimit = planAccess.questionLimit;
  let planLabel = planAccess.label;
  let isPremiumPlan = planAccess.isPremium;
  let planPriceLabel = planAccess.priceLabel;
  let upgradeOptions = planAccess.upgradeOptions;

  const dbClient =
    isGuest && serviceKey
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : supabase;

  // 3. ambil info materi (+ video + pdf)
  const { data: material, error: materialError } = await dbClient
    .from("materials")
    .select(
      "id, title, description, video_url, pdf_url, tryout_duration_minutes, subject_id, grade_id"
    )
    .eq("id", materialId)
    .single();

  if (materialError || !material) {
    if (isGuest) {
      return (
        <div className="min-h-[calc(100vh-80px)] px-4 py-6 md:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl rounded-3xl border border-rose-200 bg-white p-6 text-slate-700 shadow-xl">
            <h1 className="text-xl font-bold text-rose-600">
              Materi belum bisa dimuat
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Coba refresh halaman. Jika masih gagal, pastikan akses database
              untuk guest aktif (SUPABASE_SERVICE_ROLE_KEY).
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <Link
                href="/login"
                className="rounded-xl border border-emerald-400/70 bg-emerald-500 px-3 py-2 font-semibold text-white hover:bg-emerald-600"
              >
                Login dulu
              </Link>
              <Link
                href="/"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-600 hover:bg-slate-50"
              >
                Kembali ke beranda
              </Link>
            </div>
          </div>
        </div>
      );
    }
    redirect("/dashboard/student");
  }

  const learningTrack =
    (profile as { learning_track?: string | null })?.learning_track ?? "math";
  const gradeIds: number[] = [];
  if (!isGuest && user) {
    const { data: gradeRows } = await supabase
      .from("student_grades")
      .select("grade_id")
      .eq("student_id", user.id);
    (gradeRows ?? []).forEach((row) => {
      if (typeof row.grade_id === "number") gradeIds.push(row.grade_id);
    });
  }

  if (!isGuest && !isAdmin && learningTrack === "coding" && material.subject_id !== 4) {
    redirect("/materials");
  }

  if (
    !isGuest &&
    !isAdmin &&
    material.grade_id &&
    !gradeIds.includes(material.grade_id)
  ) {
    redirect("/materials");
  }

  // 4. ambil daftar soal (metadata saja untuk mempercepat render)
  const { data: questionMeta, error: questionError } = await dbClient
    .from("questions")
    .select("id, question_number, type, question_mode")
    .eq("material_id", materialId)
    .order("question_number", { ascending: true });

  if (questionError) {
    console.error(questionError);
  }

  const questionMetaList = questionMeta || [];
  const questionCount = questionMetaList.length;
  if (isAdmin) {
    questionLimit = questionCount;
    planLabel = "Admin";
    planPriceLabel = "Akses penuh";
    isPremiumPlan = true;
    upgradeOptions = [];
  }
  const embedUrl =
    material.video_url && material.video_url.includes("phet.colorado.edu")
      ? material.video_url
      : null;

  const { data: exampleRows } = await dbClient
    .from("questions")
    .select("id, prompt, question_image_url, question_mode")
    .eq("material_id", materialId)
    .or("question_mode.is.null,question_mode.neq.tryout")
    .order("question_number", { ascending: true })
    .limit(2);

  const exampleQuestions = (exampleRows || []).map((row) => ({
    id: row.id,
    prompt: row.prompt,
    imageUrl: row.question_image_url ?? null,
  }));

  // 5. ambil progress
  let lastQuestionNumber = 0;
  if (!isGuest && user) {
    const { data: progress } = await supabase
      .from("student_material_progress")
      .select("last_question_number")
      .eq("user_id", user.id)
      .eq("material_id", materialId)
      .single();

    lastQuestionNumber = progress?.last_question_number ?? 0;
  }

  const userId = user?.id ?? "guest";
  const displayedQuestionCount = isGuest
    ? Math.min(questionCount, questionLimit)
    : questionCount;

  if (isEmbed) {
    return (
      <div className="px-4 py-4">
        <MaterialWithResources
          material={material}
          questionMeta={questionMetaList}
          exampleQuestions={exampleQuestions}
          initialLastNumber={lastQuestionNumber}
          userId={userId}
          isPremium={isPremiumPlan}
          questionLimit={questionLimit}
          planLabel={planLabel}
          planPriceLabel={planPriceLabel}
          upgradeOptions={upgradeOptions}
          isAdmin={isAdmin}
          isGuest={isGuest}
          isEmbed
          embedUrl={embedUrl}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* ====== HEADER MATERI (UI sama persis) ====== */}
        <section
          className="
            relative overflow-hidden rounded-3xl
            border border-slate-200 bg-white/95
            shadow-[0_16px_50px_-30px_rgba(15,23,42,0.25)]
            px-5 py-6 md:px-8 md:py-7
          "
        >
          <div className="pointer-events-none absolute -left-16 top-0 h-40 w-40 rounded-full bg-emerald-200/60 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-sky-200/60 blur-3xl" />

          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-emerald-700">
              <Link
                href="/materials"
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 hover:bg-emerald-100 transition"
              >
                <span>Back</span>
                <span>Daftar materi</span>
              </Link>
              <span className="hidden text-slate-400 md:inline">/</span>
              <span className="hidden text-slate-500 md:inline">
                Latihan materi
              </span>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-600">
                  Material #{material.id}
                </p>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  {material.title}
                </h1>
                {material.description && (
                  <p className="max-w-xl text-sm md:text-[15px] text-slate-600 leading-relaxed">
                    {material.description}
                  </p>
                )}
              </div>

              <div className="mt-2 flex w-full max-w-xs flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-4 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Status akun
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold border ${
                      isGuest
                        ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                        : isPremiumPlan
                        ? "border-amber-300 bg-amber-100 text-amber-700"
                        : "border-emerald-300 bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {isGuest
                      ? "Gratis (tanpa login)"
                      : isPremiumPlan
                      ? `${planLabel} Student`
                      : "Free Student"}
                  </span>
                </div>

                <div className="h-px bg-emerald-100" />

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    {isGuest ? "Soal gratis" : "Jumlah soal"}
                  </span>
                  <span className="font-semibold text-emerald-700">
                    {displayedQuestionCount} soal
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {material.video_url && (
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] text-emerald-700 border border-emerald-200">
                      Ada video penjelasan
                    </span>
                  )}
                  {material.pdf_url && (
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] text-emerald-700 border border-emerald-200">
                      Ada worksheet / PDF
                    </span>
                  )}
                  {!material.video_url && !material.pdf_url && (
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] text-slate-600 border border-slate-200">
                      Fokus latihan soal
                    </span>
                  )}
                </div>

                {!isGuest && (
                  <Link
                    href={`/dashboard/student/materials/${material.id}/analysis`}
                    className="
                      mt-3 inline-flex items-center gap-2 rounded-xl
                      bg-emerald-600 hover:bg-emerald-700
                      border border-emerald-600
                      px-4 py-2 text-xs md:text-sm font-medium
                      text-white transition
                    "
                  >
                    Lihat laporan hasil materi ini
                  </Link>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Tips: kerjakan soal satu per satu. Kalau salah, tidak apa-apa -
              itu tanda otakmu sedang belajar.
            </p>
          </div>
        </section>

        {/* ====== AREA LATIHAN ====== */}
        <section
          className="
            relative overflow-hidden rounded-3xl
            border border-slate-200 bg-white
            p-4 md:p-6 lg:p-8
            shadow-[0_18px_50px_-40px_rgba(15,23,42,0.2)]
          "
        >
          <div className="pointer-events-none absolute -left-10 top-10 h-32 w-32 rounded-full bg-emerald-200/50 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 bottom-0 h-40 w-40 rounded-full bg-sky-200/50 blur-3xl" />

          <div className="relative z-10">
            <MaterialWithResources
              material={material}
              questionMeta={questionMetaList}
              exampleQuestions={exampleQuestions}
              initialLastNumber={lastQuestionNumber}
              userId={userId}
              isPremium={isPremiumPlan}
              questionLimit={questionLimit}
              planLabel={planLabel}
              planPriceLabel={planPriceLabel}
              upgradeOptions={upgradeOptions}
              isAdmin={isAdmin}
              isGuest={isGuest}
              isEmbed={false}
              embedUrl={embedUrl}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
