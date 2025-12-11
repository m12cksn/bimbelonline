// app/dashboard/teacher/students/[id]/materials/[mid]/page.tsx
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { UserRole } from "@/lib/type";

interface Props {
  params: Promise<{ id: string; mid: string }>;
}

type AttemptRow = {
  id: string;
  question_id: number;
  question_number: number | null;
  question_text: string | null;
  selected_answer: string | null;
  is_correct: boolean | null;
  correct_answer: string | null;
  explanation: string | null;
  created_at: string | null;
};

export default async function TeacherStudentMaterialAttemptsPage(props: Props) {
  const { id: studentId, mid: materialIdStr } = await props.params;
  const materialId = parseInt(materialIdStr, 10);
  if (Number.isNaN(materialId)) {
    redirect("/dashboard/teacher");
  }

  const supabase = await createSupabaseServerClient();

  // 1) cek auth & role guru
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: meProfile, error: meError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (meError || !meProfile) redirect("/login");
  const myRole = meProfile.role as UserRole;
  if (myRole !== "teacher") {
    if (myRole === "student") redirect("/dashboard/student");
    if (myRole === "admin") redirect("/dashboard/admin");
    redirect("/login");
  }

  // 2) ambil profil murid & materi
  const { data: studentProfile, error: studentError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", studentId)
    .single();

  if (studentError || !studentProfile) {
    redirect("/dashboard/teacher");
  }

  const { data: material, error: materialError } = await supabase
    .from("materials")
    .select("id, title")
    .eq("id", materialId)
    .single();

  if (materialError || !material) {
    redirect(`/dashboard/teacher/students/${studentId}`);
  }

  // 3) ambil attempts + join questions
  // Kita ambil dari table question_attempts, meng-join via select relationship
  // Supabase: pilih kolom dari question_attempts dan relasi questions jika tersedia
  // 3) ambil attempts + join questions (type-safe)
  type AttemptFromDB = {
    id: string;
    question_id: number;
    is_correct: boolean | null;
    selected_answer: string | null;
    created_at: string | null;
    questions: {
      question_number: number | null;
      text: string | null;
      correct_answer: string | null;
      explanation: string | null;
    } | null;
  };

  const { data: attemptsData, error: attemptsError } = await supabase
    .from("question_attempts")
    .select(
      `
      id,
      question_id,
      is_correct,
      selected_answer,
      created_at,
      questions (
        question_number,
        text,
        correct_answer,
        explanation
      )
    `
    )
    .eq("user_id", studentId)
    .eq("material_id", materialId)
    .order("created_at", { ascending: true })
    .returns<AttemptFromDB[]>(); // <-- beri generic type ke Supabase query

  if (attemptsError) {
    console.error("Error fetching attempts:", attemptsError);
  }

  // map ke AttemptRow[] yang nyaman dipakai di UI tanpa `any`
  const attempts: AttemptRow[] = (attemptsData || []).map((r) => ({
    id: r.id,
    question_id: r.question_id,
    question_number: r.questions?.question_number ?? null,
    question_text: r.questions?.text ?? null,
    selected_answer: r.selected_answer ?? null,
    is_correct: typeof r.is_correct === "boolean" ? r.is_correct : null,
    correct_answer: r.questions?.correct_answer ?? null,
    explanation: r.questions?.explanation ?? null,
    created_at: r.created_at ?? null,
  }));

  // 4) ringkasan -- total attempt, benar, akurasi
  const total = attempts.length;
  const correctCount = attempts.filter((a) => a.is_correct).length;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white">
            Riwayat Jawaban — {material.title}
          </h1>
          <p className="mt-1 text-xs text-slate-300">
            Murid:{" "}
            <span className="font-semibold">
              {studentProfile.full_name ?? studentProfile.id}
            </span>
            {" • "}Total percobaan:{" "}
            <span className="font-semibold">{total}</span>
            {accuracy !== null && (
              <>
                {" • "}Akurasi:{" "}
                <span className="font-semibold text-emerald-300">
                  {accuracy}%
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/teacher/students/${studentId}`}
            className="rounded-xl border border-slate-600 px-3 py-2 text-[11px] text-slate-100 hover:bg-slate-800"
          >
            ⬅️ Kembali
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 text-xs text-slate-50">
        {attempts.length === 0 ? (
          <div className="text-slate-300">
            Belum ada percobaan pada materi ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-[12px]">
              <thead>
                <tr className="border-b border-slate-700/70 bg-slate-900/80">
                  <th className="px-2 py-2 text-left font-semibold text-slate-300">
                    #
                  </th>
                  <th className="px-2 py-2 text-left font-semibold text-slate-300">
                    Waktu
                  </th>
                  <th className="px-2 py-2 text-left font-semibold text-slate-300">
                    Pertanyaan
                  </th>
                  <th className="px-2 py-2 text-left font-semibold text-slate-300">
                    Jawaban Murid
                  </th>
                  <th className="px-2 py-2 text-left font-semibold text-slate-300">
                    Jawaban Benar
                  </th>
                  <th className="px-2 py-2 text-center font-semibold text-slate-300">
                    Status
                  </th>
                  <th className="px-2 py-2 text-left font-semibold text-slate-300">
                    Penjelasan
                  </th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a, idx) => (
                  <tr
                    key={a.id}
                    className="border-b border-slate-800/60 hover:bg-slate-800/60 align-top"
                  >
                    <td className="px-2 py-2 align-top">
                      {a.question_number ?? idx + 1}
                    </td>
                    <td className="px-2 py-2 align-top">
                      {a.created_at
                        ? new Date(a.created_at).toLocaleString("id-ID")
                        : "-"}
                    </td>
                    <td className="px-2 py-2 align-top max-w-xl">
                      <div className="text-slate-50">
                        {a.question_text ?? "-"}
                      </div>
                    </td>
                    <td className="px-2 py-2 align-top">
                      <div className="font-mono text-[12px] text-slate-200">
                        {a.selected_answer ?? "-"}
                      </div>
                    </td>
                    <td className="px-2 py-2 align-top">
                      <div className="font-mono text-[12px] text-emerald-300">
                        {a.correct_answer ?? "-"}
                      </div>
                    </td>
                    <td className="px-2 py-2 align-top text-center">
                      {a.is_correct ? (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[11px] font-semibold text-emerald-200">
                          Benar
                        </span>
                      ) : a.is_correct === false ? (
                        <span className="rounded-full bg-red-500/20 px-2 py-1 text-[11px] font-semibold text-red-200">
                          Salah
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-600/30 px-2 py-1 text-[11px] font-semibold text-slate-100">
                          -
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 align-top">
                      {a.explanation ? (
                        <div className="text-[11px] text-slate-300 whitespace-pre-line">
                          {a.explanation}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
