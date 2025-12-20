// app/materials/[id]/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { UserRole } from "@/lib/type";
import MaterialWithResources from "./material_client";
import { getUserSubscriptionStatus } from "@/lib/subcription";

// Perhatikan: params sekarang bertipe Promise
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

  // 2. cek role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) redirect("/login");

  const role = profile.role as UserRole;
  if (role !== "student") {
    if (role === "teacher") redirect("/dashboard/teacher");
    if (role === "admin") redirect("/dashboard/admin");
    redirect("/login");
  }

  // ✅ Ambil status premium dari sistem subscription Milestone 3
  const { isPremium } = await getUserSubscriptionStatus();

  // 3. ambil info materi (+ video + pdf)
  const { data: material, error: materialError } = await supabase
    .from("materials")
    .select("id, title, description, video_url, pdf_url")
    .eq("id", materialId)
    .single();

  if (materialError || !material) {
    redirect("/dashboard/student");
  }

  // 4. ambil daftar soal
  const { data: questions, error: questionError } = await supabase
    .from("questions")
    .select("id, question_number, text, options")
    .eq("material_id", materialId)
    .order("question_number", { ascending: true });

  if (questionError) {
    console.error(questionError);
  }

  const questionList = questions || [];
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
        {/* =====================================================
            HEADER / HERO MATERI
        ====================================================== */}
        <section
          className="
            relative overflow-hidden rounded-3xl
            bg-linear-to-br from-sky-900/60 via-slate-900/60 to-indigo-950/80
            border border-slate-800/80
            shadow-[0_20px_80px_-40px_rgba(0,0,0,1)]
            px-5 py-6 md:px-8 md:py-7
          "
        >
          {/* Glow efek */}
          <div className="pointer-events-none absolute -left-16 top-0 h-40 w-40 rounded-full bg-cyan-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-violet-500/25 blur-3xl" />

          <div className="relative z-10 space-y-4">
            {/* Breadcrumb */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-cyan-200/80">
              <Link
                href="/materials"
                className="inline-flex items-center gap-1 rounded-full bg-slate-900/60 px-3 py-1 hover:bg-slate-800/80 transition"
              >
                ⬅️
                <span>Kembali ke daftar materi</span>
              </Link>
              <span className="hidden text-slate-500 md:inline">/</span>
              <span className="hidden text-slate-400 md:inline">
                Latihan materi
              </span>
            </div>
            {/* Judul + Info singkat */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-300/80">
                  Material #{material.id}
                </p>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {material.title}
                </h1>
                {material.description && (
                  <p className="max-w-xl text-sm md:text-[15px] text-slate-200/90 leading-relaxed">
                    {material.description}
                  </p>
                )}
              </div>

              {/* Badge status & info resource */}
              <div className="mt-2 flex w-full max-w-xs flex-col gap-3 rounded-2xl border border-sky-500/40 bg-slate-950/60 px-4 py-4 text-xs text-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Status akun
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold border ${
                      isPremium
                        ? "border-amber-400/60 bg-amber-400/15 text-amber-200"
                        : "border-cyan-400/60 bg-cyan-500/10 text-cyan-200"
                    }`}
                  >
                    {isPremium ? "Premium Student 🌟" : "Free Student"}
                  </span>
                </div>

                <div className="h-px bg-slate-800/80" />

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Jumlah soal
                  </span>
                  <span className="font-semibold text-sky-200">
                    {questionCount} soal
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {material.video_url && (
                    <span className="rounded-full bg-slate-900/80 px-3 py-1 text-[11px] text-cyan-200">
                      🎥 Ada video penjelasan
                    </span>
                  )}
                  {material.pdf_url && (
                    <span className="rounded-full bg-slate-900/80 px-3 py-1 text-[11px] text-emerald-200">
                      📄 Ada worksheet / PDF
                    </span>
                  )}
                  {!material.video_url && !material.pdf_url && (
                    <span className="rounded-full bg-slate-900/80 px-3 py-1 text-[11px] text-slate-300">
                      ✏️ Fokus latihan soal
                    </span>
                  )}
                </div>
                <Link
                  href={`/dashboard/student/materials/${material.id}/analysis`}
                  className="
    mt-3 inline-flex items-center gap-2 rounded-xl
    bg-emerald-500/20 hover:bg-emerald-500/30
    border border-emerald-500/20
    px-4 py-2 text-xs md:text-sm font-medium
    text-emerald-200 transition
  "
                >
                  📊 Lihat laporan hasil materi ini
                </Link>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Tips: kerjakan soal satu per satu. Kalau salah, tidak apa-apa —
              itu tanda otakmu sedang belajar. 💡
            </p>
          </div>
        </section>

        {/* =====================================================
            AREA LATIHAN (QUIZ + RESOURCE)
        ====================================================== */}
        <section
          className="
            relative overflow-hidden rounded-3xl
            border border-slate-800 bg-slate-950/80
            p-4 md:p-6 lg:p-8
            shadow-[0_18px_60px_-45px_rgba(0,0,0,1)]
          "
        >
          <div className="pointer-events-none absolute -left-10 top-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 bottom-0 h-40 w-40 rounded-full bg-indigo-500/15 blur-3xl" />

          <div className="relative z-10">
            <MaterialWithResources
              material={material}
              questions={questionList}
              initialLastNumber={lastQuestionNumber}
              userId={user.id}
              isPremium={isPremium}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
