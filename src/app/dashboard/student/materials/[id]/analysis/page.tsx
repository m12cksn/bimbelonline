// src/app/dashboard/student/materials/[id]/analysis/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { UserRole } from "@/lib/type";
import AttemptPerQuestionDetails, {
  AttemptQuestionDetail,
} from "@/app/materials/[id]/AttemptPerQuestionDetails";

interface AnalysisPageProps {
  params: Promise<{ id: string }>;
}

type MaterialRow = {
  id: number;
  title: string;
  description: string | null;
};

type QuestionRow = {
  id: number;
  question_number: number;
  text: string;
  correct_answer: string;
};

type MaterialAttemptRow = {
  attempt_number: number;
  correct: number;
  wrong: number;
  total_answered: number;
  score: number;
};

type QuestionAttemptRow = {
  question_id: number;
  is_correct: boolean;
  selected_answer: string | null;
  attempt_number: number;
};

type QuestionStatus = "unanswered" | "correct" | "wrong";

export default async function MaterialAnalysisPage(props: AnalysisPageProps) {
  const { id } = await props.params;
  const materialId = parseInt(id, 10);

  if (Number.isNaN(materialId)) {
    redirect("/dashboard/student");
  }

  const supabase = await createSupabaseServerClient();

  // 1. Cek user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Cek role = student
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/login");
  }

  const role = profile.role as UserRole;
  if (role !== "student") {
    if (role === "teacher") redirect("/dashboard/teacher");
    if (role === "admin") redirect("/dashboard/admin");
    redirect("/login");
  }

  const displayName =
    profile.full_name ||
    user.user_metadata?.full_name ||
    user.email ||
    "Student";

  // 3. Ambil info materi
  const { data: material, error: materialError } = await supabase
    .from("materials")
    .select("id, title, description")
    .eq("id", materialId)
    .single();

  if (materialError || !material) {
    redirect("/dashboard/student");
  }

  // 4. Ambil semua soal untuk materi ini (sekarang termasuk text & correct_answer)
  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("id, question_number, text, correct_answer")
    .eq("material_id", materialId)
    .order("question_number", { ascending: true });

  if (questionsError) {
    console.error("questionsError:", questionsError);
  }

  const questionList: QuestionRow[] = questions ?? [];
  const totalQuestions = questionList.length;
  const questionById = new Map<number, QuestionRow>();
  questionList.forEach((q) => questionById.set(q.id, q));

  // 5. Ambil summary attempt per materi (attempt 1 & 2)
  const { data: attemptRows, error: attemptsError } = await supabase
    .from("material_attempts")
    .select("attempt_number, correct, wrong, total_answered, score")
    .eq("user_id", user.id)
    .eq("material_id", materialId)
    .order("attempt_number", { ascending: true });

  if (attemptsError) {
    console.error("material_attempts error:", attemptsError);
  }

  const attempts: MaterialAttemptRow[] = attemptRows ?? [];
  const attempt1 = attempts.find((a) => a.attempt_number === 1) ?? null;
  const attempt2 = attempts.find((a) => a.attempt_number === 2) ?? null;

  // 6. Ambil semua attempt per soal untuk user ini
  const { data: perQuestionAttempts, error: perQuestionError } = await supabase
    .from("question_attempts")
    .select("question_id, is_correct, selected_answer, attempt_number")
    .eq("user_id", user.id)
    .eq("material_id", materialId);

  if (perQuestionError) {
    console.error("question_attempts error:", perQuestionError);
  }

  const questionAttempts: QuestionAttemptRow[] = perQuestionAttempts ?? [];

  // 7a. Status akhir per soal (untuk ringkasan besar di tengah)
  const statusByQuestionId = new Map<number, QuestionStatus>();
  questionAttempts.forEach((row) => {
    const current = statusByQuestionId.get(row.question_id);
    if (row.is_correct) {
      statusByQuestionId.set(row.question_id, "correct");
    } else if (!current) {
      statusByQuestionId.set(row.question_id, "wrong");
    }
  });

  const perQuestionStatus = questionList.map((q) => {
    const status = statusByQuestionId.get(q.id) ?? "unanswered";
    return {
      questionNumber: q.question_number,
      status,
    };
  });

  const answeredCount = perQuestionStatus.filter(
    (q) => q.status !== "unanswered"
  ).length;
  const correctCount = perQuestionStatus.filter(
    (q) => q.status === "correct"
  ).length;
  const wrongCount = perQuestionStatus.filter(
    (q) => q.status === "wrong"
  ).length;
  const overallAccuracy =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const wrongNumbers = perQuestionStatus
    .filter((q) => q.status === "wrong")
    .map((q) => q.questionNumber)
    .sort((a, b) => a - b);

  const correctNumbers = perQuestionStatus
    .filter((q) => q.status === "correct")
    .map((q) => q.questionNumber)
    .sort((a, b) => a - b);

  const unansweredNumbers = perQuestionStatus
    .filter((q) => q.status === "unanswered")
    .map((q) => q.questionNumber)
    .sort((a, b) => a - b);

  // 7b. Detail per attempt (untuk bubble + popover percobaan 1 & 2)
  const attemptsByQAndAttempt = new Map<string, QuestionAttemptRow>();
  questionAttempts.forEach((row) => {
    const key = `${row.question_id}-${row.attempt_number}`;
    if (!attemptsByQAndAttempt.has(key)) {
      attemptsByQAndAttempt.set(key, row);
    }
  });

  const buildAttemptDetails = (attemptNo: 1 | 2): AttemptQuestionDetail[] => {
    return questionList.map((q) => {
      const key = `${q.id}-${attemptNo}`;
      const attemptRow = attemptsByQAndAttempt.get(key);
      let status: QuestionStatus = "unanswered";
      if (attemptRow) {
        status = attemptRow.is_correct ? "correct" : "wrong";
      }

      return {
        questionNumber: q.question_number,
        status,
        questionText: q.text,
        selectedAnswer: attemptRow?.selected_answer ?? null,
        correctAnswer: q.correct_answer,
      };
    });
  };

  const attempt1Details = buildAttemptDetails(1);
  const attempt2Details = buildAttemptDetails(2);

  return (
    <div className="min-h-[calc(100vh-80px)] px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6 md:space-y-8">
        {/* =====================================================
            BREADCRUMB / NAV
        ====================================================== */}
        <nav className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <Link
            href="/dashboard/student"
            className="transition hover:text-cyan-300"
          >
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/materials" className="transition hover:text-cyan-300">
            Materials
          </Link>
          <span>/</span>
          <Link
            href={`/materials/${materialId}`}
            className="transition hover:text-cyan-300"
          >
            {material.title}
          </Link>
          <span>/</span>
          <span className="text-cyan-300">Analysis</span>
        </nav>

        {/* =====================================================
            HEADER / HERO
        ====================================================== */}
        <section
          className="
            relative overflow-hidden rounded-3xl
            bg-linear-to-br from-sky-900/50 via-slate-900/60 to-indigo-950/70
            border border-slate-800/80
            shadow-[0_20px_80px_-40px_rgba(0,0,0,1)]
            px-5 py-6 md:px-8 md:py-8
          "
        >
          <div className="pointer-events-none absolute -left-16 top-0 h-40 w-40 rounded-full bg-cyan-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-violet-500/25 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-300/80">
                Study Report
              </p>
              <h1 className="text-2xl font-bold text-white md:text-3xl">
                Laporan belajar:{" "}
                <span className="text-cyan-300">{material.title}</span>
              </h1>
              <p className="max-w-xl text-xs leading-relaxed text-slate-300/90 md:text-sm">
                Halo{" "}
                <span className="font-semibold text-cyan-200">
                  {displayName.split(" ")[0]}
                </span>
                , ini adalah ringkasan hasil latihanmu untuk materi ini. Kamu
                bisa lihat soal mana yang sudah jago dan soal mana yang masih
                perlu latihan lagi. 💪
              </p>
            </div>

            <div
              className="
                mt-3 flex w-full max-w-xs flex-col gap-3
                rounded-2xl border border-sky-500/40 bg-slate-950/70
                px-4 py-4 text-sm text-slate-100
              "
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Total soal</span>
                <span className="font-semibold text-sky-200">
                  {totalQuestions}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Sudah dijawab</span>
                <span className="font-semibold text-emerald-200">
                  {answeredCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Akurasi akhir</span>
                <span className="font-semibold text-amber-200">
                  {overallAccuracy}%
                </span>
              </div>
              <div className="h-px bg-slate-800/80" />
              <p className="text-[11px] leading-relaxed text-slate-400">
                Warna hijau = sudah dikuasai, merah = perlu latihan lagi,
                abu-abu = belum dicoba.
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================
            ATTEMPT SUMMARY (Percobaan 1 & 2)
        ====================================================== */}
        <section className="grid gap-4 md:grid-cols-2">
          {/* Attempt 1 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-5 py-4 shadow-[0_18px_60px_-45px_rgba(0,0,0,1)]">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Percobaan 1
                </p>
                <h2 className="text-lg font-semibold text-sky-100">
                  First try result
                </h2>
              </div>
              <span className="text-2xl">🎯</span>
            </div>

            {attempt1 ? (
              <div className="space-y-3 text-sm text-slate-200">
                <div className="flex items-center justify-between">
                  <span>Benar</span>
                  <span className="font-semibold text-emerald-300">
                    {attempt1.correct}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Salah</span>
                  <span className="font-semibold text-rose-300">
                    {attempt1.wrong}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Soal dijawab</span>
                  <span className="font-semibold text-sky-200">
                    {attempt1.total_answered}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Nilai</span>
                  <span className="font-semibold text-amber-200">
                    {Math.round(attempt1.score)}%
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                Belum ada data percobaan pertama untuk materi ini. Silakan
                kerjakan soal dulu ya.
              </p>
            )}
          </div>

          {/* Attempt 2 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-5 py-4 shadow-[0_18px_60px_-45px_rgba(0,0,0,1)]">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Percobaan 2
                </p>
                <h2 className="text-lg font-semibold text-sky-100">
                  Second try result
                </h2>
              </div>
              <span className="text-2xl">📋</span>
            </div>

            {attempt2 ? (
              <div className="space-y-3 text-sm text-slate-200">
                <div className="flex items-center justify-between">
                  <span>Benar</span>
                  <span className="font-semibold text-emerald-300">
                    {attempt2.correct}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Salah</span>
                  <span className="font-semibold text-rose-300">
                    {attempt2.wrong}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Soal dijawab</span>
                  <span className="font-semibold text-sky-200">
                    {attempt2.total_answered}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Nilai</span>
                  <span className="font-semibold text-amber-200">
                    {Math.round(attempt2.score)}%
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                Belum ada percobaan kedua. Kamu bisa mencoba lagi dari halaman
                soal untuk melihat peningkatan skor.
              </p>
            )}
          </div>
        </section>

        {/* =====================================================
            RINGKASAN PER NOMOR (GABUNGAN)
        ====================================================== */}
        <section className="rounded-3xl border border-slate-800 bg-slate-950/80 px-5 py-5 md:px-6 md:py-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-sky-100">
                Ringkasan per nomor soal
              </h2>
              <p className="max-w-xl text-xs text-slate-400 md:text-sm">
                Lihat nomor soal mana yang sudah dikuasai (hijau), mana yang
                sering salah (merah), dan mana yang belum dicoba (abu-abu).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Benar
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-1 text-rose-200">
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                Salah
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/40 px-2.5 py-1 text-slate-300">
                <span className="h-2 w-2 rounded-full bg-slate-500" />
                Belum dijawab
              </span>
            </div>
          </div>

          {totalQuestions === 0 ? (
            <p className="text-sm text-slate-400">
              Belum ada soal untuk materi ini.
            </p>
          ) : (
            <>
              {/* Bubble ringkasan besar */}
              <div className="mb-4 grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
                {perQuestionStatus.map((q) => {
                  let bg = "bg-slate-700/60 text-slate-100 border-slate-600";
                  if (q.status === "correct") {
                    bg =
                      "bg-emerald-500/25 text-emerald-100 border-emerald-400/70";
                  } else if (q.status === "wrong") {
                    bg = "bg-rose-500/25 text-rose-100 border-rose-400/70";
                  }

                  return (
                    <div
                      key={q.questionNumber}
                      className={`
                        flex h-9 w-9 items-center justify-center rounded-full
                        border text-xs font-semibold
                        ${bg}
                      `}
                    >
                      {q.questionNumber}
                    </div>
                  );
                })}
              </div>

              {/* List nomor salah / benar */}
              <div className="grid gap-4 text-xs md:grid-cols-3 md:text-sm">
                <div className="space-y-1 rounded-2xl border border-emerald-500/30 bg-slate-900/80 p-3">
                  <p className="font-semibold text-emerald-200">
                    Nomor yang sudah benar
                  </p>
                  <p className="text-slate-300">
                    {correctNumbers.length === 0
                      ? "Belum ada nomor yang benar. Tidak apa-apa, mulai pelan-pelan dulu ya."
                      : correctNumbers.join(", ")}
                  </p>
                </div>

                <div className="space-y-1 rounded-2xl border border-rose-500/30 bg-slate-900/80 p-3">
                  <p className="font-semibold text-rose-200">
                    Nomor yang masih sering salah
                  </p>
                  <p className="text-slate-300">
                    {wrongNumbers.length === 0
                      ? "Tidak ada nomor yang salah. Keren banget! 🎉"
                      : wrongNumbers.join(", ")}
                  </p>
                </div>

                <div className="space-y-1 rounded-2xl border border-slate-600/50 bg-slate-900/80 p-3">
                  <p className="font-semibold text-slate-200">
                    Nomor yang belum dicoba
                  </p>
                  <p className="text-slate-300">
                    {unansweredNumbers.length === 0
                      ? "Semua nomor sudah kamu sentuh. Mantap!"
                      : unansweredNumbers.join(", ")}
                  </p>
                </div>
              </div>
            </>
          )}
        </section>

        {/* =====================================================
            DETAIL PERCOBAAN 1 & 2 (POPOVER)
        ====================================================== */}
        <section className="space-y-4">
          {/* Attempt 1 detail */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 px-5 py-5 md:px-6 md:py-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-sky-100">
                  Detail hasil percobaan 1 🔍
                </h2>
                <p className="text-xs text-slate-400 md:text-sm">
                  Lihat nomor mana saja yang benar dan salah khusus untuk
                  percobaan pertama. Klik bubble untuk melihat detail soal.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Benar
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-1 text-rose-200">
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                  Salah
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/40 px-2.5 py-1 text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-slate-500" />
                  Belum dijawab
                </span>
              </div>
            </div>

            <AttemptPerQuestionDetails
              attemptNumber={1}
              details={attempt1Details}
            />
          </div>

          {/* Attempt 2 detail */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 px-5 py-5 md:px-6 md:py-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-sky-100">
                  Detail hasil percobaan 2 🔍
                </h2>
                <p className="text-xs text-slate-400 md:text-sm">
                  Lihat perkembanganmu pada percobaan kedua. Klik bubble untuk
                  melihat detail soal.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Benar
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-1 text-rose-200">
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                  Salah
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/40 px-2.5 py-1 text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-slate-500" />
                  Belum dijawab
                </span>
              </div>
            </div>

            <AttemptPerQuestionDetails
              attemptNumber={2}
              details={attempt2Details}
            />
          </div>
        </section>

        {/* =====================================================
            BOTTOM ACTIONS
        ====================================================== */}
        <section className="flex flex-wrap justify-between gap-3">
          <Link
            href={`/materials/${materialId}`}
            className="
              inline-flex items-center gap-2 rounded-2xl
              bg-cyan-600/80 px-4 py-2 text-sm font-semibold text-white
              shadow-md shadow-cyan-500/30 transition hover:bg-cyan-500
            "
          >
            🔁 Kembali ke soal & latihan
          </Link>

          <Link
            href="/dashboard/student"
            className="
              inline-flex items-center gap-2 rounded-2xl
              border border-slate-600/70 bg-slate-900/80
              px-4 py-2 text-sm font-semibold text-slate-100
              transition hover:border-cyan-400/70 hover:text-cyan-100
            "
          >
            ⬅️ Kembali ke dashboard
          </Link>
        </section>
      </div>
    </div>
  );
}
