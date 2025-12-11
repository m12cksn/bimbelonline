// app/dashboard/teacher/students/[id]/page.tsx
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import React from "react";
import type { UserRole } from "@/lib/type";
import Link from "next/link";
import TeacherNoteEditor from "@/app/dashboard/teacher/components/TeacherNoteEditor";

interface PageProps {
  params: Promise<{ id: string }>;
}

type StudentProfileRow = {
  id: string;
  full_name: string | null;
  grade_id: number | null;
  is_premium: boolean | null;
};

type MaterialRow = {
  id: number;
  title: string;
  description: string | null;
};

type QuestionRow = {
  material_id: number;
};

type ProgressRow = {
  material_id: number;
  last_question_number: number;
  is_completed: boolean | null;
  updated_at: string | null;
};

type AttemptRow = {
  material_id: number;
  is_correct: boolean;
  created_at: string;
};

export default async function TeacherStudentDetailPage(props: PageProps) {
  const { id: studentId } = await props.params;

  const supabase = await createSupabaseServerClient();

  // 1. cek user login
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // 2. cek role guru
  const { data: meProfile, error: meError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (meError || !meProfile) {
    redirect("/login");
  }

  const myRole = meProfile.role as UserRole;
  if (myRole !== "teacher") {
    if (myRole === "student") redirect("/dashboard/student");
    if (myRole === "admin") redirect("/dashboard/admin");
    redirect("/login");
  }

  // 3. ambil profil murid
  const { data: studentProfile, error: studentError } = await supabase
    .from("profiles")
    .select("id, full_name, grade_id, is_premium")
    .eq("id", studentId)
    .single<StudentProfileRow>();

  if (studentError || !studentProfile) {
    redirect("/dashboard/teacher");
  }

  const studentName =
    studentProfile.full_name && studentProfile.full_name.trim().length > 0
      ? studentProfile.full_name
      : "Tanpa nama";

  const gradeLabel = studentProfile.grade_id
    ? `Kelas ${studentProfile.grade_id}`
    : "Kelas belum di-set";

  const isPremium = !!studentProfile.is_premium;

  // 4. ambil daftar materi (aktif) untuk kelas murid ini
  let materialsQuery = supabase
    .from("materials")
    .select("id, title, description")
    .eq("is_active", true)
    .order("id", { ascending: true });

  if (studentProfile.grade_id) {
    materialsQuery = materialsQuery.eq("grade_id", studentProfile.grade_id);
  }

  const { data: materialsData, error: materialsError } =
    await materialsQuery.returns<MaterialRow[]>();

  if (materialsError) {
    console.error("Teacher student detail - materials error:", materialsError);
  }

  const materials: MaterialRow[] = materialsData || [];

  if (materials.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-white">
              Detail Murid: {studentName}
            </h1>
            <p className="mt-1 text-xs text-slate-300">
              {gradeLabel} • Status:{" "}
              <span className={isPremium ? "text-amber-300" : "text-slate-200"}>
                {isPremium ? "Premium ⭐" : "Gratis 🎁"}
              </span>
            </p>
          </div>
          <Link
            href="/dashboard/teacher"
            className="rounded-xl border border-slate-600 px-3 py-2 text-[11px] text-slate-100 hover:bg-slate-800"
          >
            ⬅️ Kembali ke Dashboard Guru
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 text-sm text-slate-200">
          Belum ada materi aktif untuk kelas murid ini.
        </div>
      </div>
    );
  }

  const materialIds = materials.map((m) => m.id);

  // 5. jumlah soal per materi
  const { data: questionRows, error: questionsError } = await supabase
    .from("questions")
    .select("material_id")
    .in("material_id", materialIds)
    .returns<QuestionRow[]>();

  if (questionsError) {
    console.error("Teacher student detail - questions error:", questionsError);
  }

  const totalQuestionsByMaterial = new Map<number, number>();
  (questionRows || []).forEach((q) => {
    totalQuestionsByMaterial.set(
      q.material_id,
      (totalQuestionsByMaterial.get(q.material_id) ?? 0) + 1
    );
  });

  // 6. progress murid per materi
  const { data: progressRows, error: progressError } = await supabase
    .from("student_material_progress")
    .select("material_id, last_question_number, is_completed, updated_at")
    .eq("user_id", studentProfile.id)
    .in("material_id", materialIds)
    .returns<ProgressRow[]>();

  if (progressError) {
    console.error("Teacher student detail - progress error:", progressError);
  }

  const progressByMaterial = new Map<number, ProgressRow>();
  (progressRows || []).forEach((p) => {
    progressByMaterial.set(p.material_id, p);
  });

  // 7. attempts murid per materi
  const { data: attemptRows, error: attemptsError } = await supabase
    .from("question_attempts")
    .select("material_id, is_correct, created_at")
    .eq("user_id", studentProfile.id)
    .in("material_id", materialIds)
    .order("created_at", { ascending: true })
    .returns<AttemptRow[]>();

  if (attemptsError) {
    console.error("Teacher student detail - attempts error:", attemptsError);
  }

  const attemptsByMaterial = new Map<
    number,
    { total: number; correct: number; lastActivity: string | null }
  >();

  (attemptRows || []).forEach((row) => {
    const current = attemptsByMaterial.get(row.material_id) || {
      total: 0,
      correct: 0,
      lastActivity: null as string | null,
    };

    current.total += 1;
    if (row.is_correct) current.correct += 1;

    if (!current.lastActivity) {
      current.lastActivity = row.created_at;
    } else {
      // ambil waktu terakhir (terbesar)
      if (new Date(row.created_at) > new Date(current.lastActivity)) {
        current.lastActivity = row.created_at;
      }
    }

    attemptsByMaterial.set(row.material_id, current);
  });

  // 8. bentuk list ringkasan per materi
  const materialSummaries = materials.map((m) => {
    const totalQuestions = totalQuestionsByMaterial.get(m.id) ?? 0;
    const progress = progressByMaterial.get(m.id);
    const attempts = attemptsByMaterial.get(m.id);

    const answered = progress?.last_question_number ?? 0;
    const answeredClamped =
      totalQuestions > 0 ? Math.min(answered, totalQuestions) : answered;

    const totalAttempts = attempts?.total ?? 0;
    const correct = attempts?.correct ?? 0;
    const accuracy =
      totalAttempts > 0 ? Math.round((correct / totalAttempts) * 100) : null;

    const lastActivity = attempts?.lastActivity ?? progress?.updated_at ?? null;

    let statusLabel = "Belum mulai";
    if (totalQuestions === 0) {
      statusLabel = "Belum ada soal";
    } else if (answeredClamped === 0 && totalAttempts === 0) {
      statusLabel = "Belum mulai";
    } else if (answeredClamped < totalQuestions) {
      statusLabel = `Berjalan (soal terakhir: ${answeredClamped})`;
    } else if (answeredClamped >= totalQuestions) {
      statusLabel = "Selesai semua 🎉";
    }

    return {
      material: m,
      totalQuestions,
      answered: answeredClamped,
      totalAttempts,
      correct,
      accuracy,
      lastActivity,
      statusLabel,
    };
  });

  return (
    <div className="space-y-5">
      {/* Header murid */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white">
            Detail Murid: {studentName}
          </h1>
          <p className="mt-1 text-xs text-slate-300">
            {gradeLabel} • Status:{" "}
            <span className={isPremium ? "text-amber-300" : "text-slate-200"}>
              {isPremium ? "Premium ⭐" : "Gratis 🎁"}
            </span>
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Ringkasan per materi: jumlah soal, progres, dan akurasi jawaban.
          </p>
        </div>
        <Link
          href="/dashboard/teacher"
          className="rounded-xl border border-slate-600 px-3 py-2 text-[11px] text-slate-100 hover:bg-slate-800"
        >
          ⬅️ Kembali ke Dashboard Guru
        </Link>
      </div>

      {/* Tabel ringkasan per materi */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 text-xs text-slate-50">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">
            Progres per Materi 📚
          </h2>
          <span className="text-[10px] text-slate-400">
            Total materi: {materialSummaries.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-[11px]">
            <thead>
              <tr className="border-b border-slate-700/70 bg-slate-900/80">
                <th className="px-2 py-2 text-left font-semibold text-slate-300">
                  Materi
                </th>
                <th className="px-2 py-2 text-center font-semibold text-slate-300">
                  Soal (dikerjakan)
                </th>
                <th className="px-2 py-2 text-center font-semibold text-slate-300">
                  Benar / Total Jawaban
                </th>
                <th className="px-2 py-2 text-center font-semibold text-slate-300">
                  Akurasi
                </th>
                <th className="px-2 py-2 text-left font-semibold text-slate-300">
                  Status
                </th>
                <th className="px-2 py-2 text-left font-semibold text-slate-300">
                  Terakhir latihan
                </th>
              </tr>
            </thead>

            <tbody>
              {materialSummaries.map((item) => (
                <React.Fragment key={item.material.id}>
                  {/* Baris informasi materi */}
                  <tr className="border-b border-slate-800/60 hover:bg-slate-800/60">
                    <td className="px-2 py-2 align-top">
                      <Link
                        href={`/dashboard/teacher/students/${studentProfile.id}/materials/${item.material.id}`}
                        className="font-semibold text-slate-50 hover:underline"
                      >
                        {item.material.title}
                      </Link>
                      {item.material.description && (
                        <div className="text-[10px] text-slate-400">
                          {item.material.description}
                        </div>
                      )}
                    </td>

                    <td className="px-2 py-2 align-top text-center">
                      {item.totalQuestions > 0 ? (
                        <>
                          {item.answered}/{item.totalQuestions}
                        </>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="px-2 py-2 align-top text-center">
                      {item.totalAttempts > 0 ? (
                        <>
                          {item.correct}/{item.totalAttempts}
                        </>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="px-2 py-2 align-top text-center">
                      {item.accuracy !== null ? (
                        <span className="font-semibold text-emerald-300">
                          {item.accuracy}%
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="px-2 py-2 align-top text-left">
                      {item.statusLabel}
                    </td>

                    <td className="px-2 py-2 align-top text-left">
                      {item.lastActivity
                        ? new Date(item.lastActivity).toLocaleString("id-ID")
                        : "-"}
                    </td>
                  </tr>

                  {/* Baris CATATAN GURU */}
                  <tr className="border-b border-slate-800/40">
                    <td colSpan={6} className="px-2 py-3 bg-slate-800/40">
                      <TeacherNoteEditor
                        studentId={studentProfile.id}
                        materialId={item.material.id}
                      />
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
