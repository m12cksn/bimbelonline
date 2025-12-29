// app/materials/[id]/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { UserRole } from "@/lib/type";
import MaterialWithResources from "./material_client";
import { getUserSubscriptionStatus } from "@/lib/subcription";
import { resolvePlanAccess } from "@/lib/planAccess";

// params: Promise<{ id: string }> -> sesuai file kamu
interface MaterialPageProps {
  params: Promise<{ id: string }>;
}

export default async function MaterialPage(props: MaterialPageProps) {
  const { id } = await props.params;

  const materialId = parseInt(id, 10);
  if (Number.isNaN(materialId)) {
    redirect("/dashboard/student");
  }

  const supabase = await createSupabaseServerClient();

  // 1. cek user login
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. cek role + is_premium dari profiles
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_premium, learning_track") // 👈 tambahkan is_premium
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.warn("profiles fetch error", profileError);
  }

  const role: UserRole =
    (profile?.role as UserRole | undefined) ||
    (user.user_metadata?.role as UserRole | undefined) ||
    ((user as any)?.app_metadata?.role as UserRole | undefined) ||
    "student";

  if (role !== "student") {
    if (role === "teacher") redirect("/dashboard/teacher");
    if (role === "admin") redirect("/dashboard/admin");
    redirect("/login");
  }

  // ✅ Sumber utama: profiles.is_premium
  let isPremium = profile?.is_premium === true;
  let planName: string | null = null;
  let planCode: string | null = null;

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

  const planAccess = resolvePlanAccess(planCode, planName, isPremium);
  const questionLimit = planAccess.questionLimit;
  const planLabel = planAccess.label;
  const isPremiumPlan = planAccess.isPremium;
  const planPriceLabel = planAccess.priceLabel;
  const upgradeOptions = planAccess.upgradeOptions;

  // 3. ambil info materi (+ video + pdf)
  const { data: material, error: materialError } = await supabase
    .from("materials")
    .select(
      "id, title, description, video_url, pdf_url, tryout_duration_minutes, subject_id"
    )
    .eq("id", materialId)
    .single();

  if (materialError || !material) {
    redirect("/dashboard/student");
  }

  const learningTrack =
    (profile as { learning_track?: string | null })?.learning_track ?? "math";

  if (learningTrack === "coding" && material.subject_id !== 4) {
    redirect("/materials");
  }

  // 4. ambil daftar soal
  const { data: questions, error: questionError } = await supabase
    .from("questions")
    .select("id, material_id, question_number, type, prompt, helper_text, question_image_url, question_mode")
    .eq("material_id", materialId)
    .order("question_number", { ascending: true });

  if (questionError) {
    console.error(questionError);
  }

  const questionList = questions || [];
  const questionIds = questionList.map((q) => q.id);

  let optionsByQuestion = new Map();
  let targetsByQuestion = new Map();
  let itemsByQuestion = new Map();
  let partsByQuestion = new Map();

  if (questionIds.length > 0) {
    const { data: optionRows, error: optionsError } = await supabase
      .from("question_options")
      .select("question_id, label, value, image_url, sort_order, is_correct")
      .in("question_id", questionIds)
      .order("sort_order", { ascending: true });

    if (optionsError) {
      console.error("question_options error", optionsError);
    }

    const { data: targetRows, error: targetsError } = await supabase
      .from("question_drop_targets")
      .select("id, question_id, label, placeholder, sort_order")
      .in("question_id", questionIds)
      .order("sort_order", { ascending: true });

    if (targetsError) {
      console.error("question_drop_targets error", targetsError);
    }

    const { data: itemRows, error: itemsError } = await supabase
      .from("question_drop_items")
      .select("id, question_id, label, image_url, correct_target_id, sort_order")
      .in("question_id", questionIds)
      .order("sort_order", { ascending: true });

    if (itemsError) {
      console.error("question_drop_items error", itemsError);
    }

    const { data: partRows, error: partsError } = await supabase
      .from("question_items")
      .select("id, question_id, label, prompt, image_url, sort_order")
      .in("question_id", questionIds)
      .order("sort_order", { ascending: true });

    if (partsError) {
      console.error("question_items error", partsError);
    }

    for (const row of optionRows || []) {
      const list = optionsByQuestion.get(row.question_id) || [];
      list.push(row);
      optionsByQuestion.set(row.question_id, list);
    }

    for (const row of targetRows || []) {
      const list = targetsByQuestion.get(row.question_id) || [];
      list.push(row);
      targetsByQuestion.set(row.question_id, list);
    }

    for (const row of itemRows || []) {
      const list = itemsByQuestion.get(row.question_id) || [];
      list.push(row);
      itemsByQuestion.set(row.question_id, list);
    }

    for (const row of partRows || []) {
      const list = partsByQuestion.get(row.question_id) || [];
      list.push(row);
      partsByQuestion.set(row.question_id, list);
    }
  }

  const normalizedQuestions = questionList.map((q) => ({
    ...q,
    options: optionsByQuestion.get(q.id) || [],
    drop_targets: targetsByQuestion.get(q.id) || [],
    drop_items: itemsByQuestion.get(q.id) || [],
    items: partsByQuestion.get(q.id) || [],
  }));
  const questionCount = questionList.length;

  // 5. ambil progress
  const { data: progress } = await supabase
    .from("student_material_progress")
    .select("last_question_number")
    .eq("user_id", user.id)
    .eq("material_id", materialId)
    .single();

  const lastQuestionNumber = progress?.last_question_number ?? 0;

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
                      isPremiumPlan
                        ? "border-amber-300 bg-amber-100 text-amber-700"
                        : "border-emerald-300 bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {isPremiumPlan ? `${planLabel} Student` : "Free Student"}
                  </span>
                </div>

                <div className="h-px bg-emerald-100" />

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Jumlah soal
                  </span>
                  <span className="font-semibold text-emerald-700">
                    {questionCount} soal
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
              questions={normalizedQuestions}
              initialLastNumber={lastQuestionNumber}
              userId={user.id}
              isPremium={isPremiumPlan}
              questionLimit={questionLimit}
              planLabel={planLabel}
              planPriceLabel={planPriceLabel}
              upgradeOptions={upgradeOptions}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
