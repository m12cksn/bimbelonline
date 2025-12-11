// app/dashboard/teacher/page.tsx
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { UserRole } from "@/lib/type";
import { redirect } from "next/navigation";
import Link from "next/link";

type StudentRow = {
  id: string;
  full_name?: string | null;
  grade_id?: number | null;
  is_premium?: boolean | null; // legacy, masih boleh dipakai sebagai fallback
};

type SubRow = {
  user_id: string;
  status: string;
  start_at: string;
  end_at: string;
};

export default async function TeacherDashboardPage() {
  const supabase = await createSupabaseServerClient();

  // 1. cek user login
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 2. cek role guru
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) redirect("/login");

  const role = profile.role as UserRole;

  if (role !== "teacher") {
    if (role === "student") redirect("/dashboard/student");
    if (role === "admin") redirect("/dashboard/admin");
    redirect("/login");
  }

  // 3. ambil semua student
  const { data: studentProfiles, error: studentsError } = await supabase
    .from("profiles")
    .select("id, full_name, grade_id, is_premium")
    .eq("role", "student")
    .order("full_name", { ascending: true });

  if (studentsError) {
    console.error(studentsError);
  }

  const students: StudentRow[] = studentProfiles || [];
  if (students.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold text-white">
          Dashboard Guru 👩‍🏫👨‍🏫
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Belum ada murid yang terdaftar. Silakan tambahkan murid dulu.
        </p>
      </div>
    );
  }

  const studentIds = students.map((s) => s.id);

  // 4. cek subscription aktif per murid (READ ONLY, bukan untuk mengubah)
  const nowIso = new Date().toISOString();

  const { data: subs, error: subsError } = await supabase
    .from("subscriptions")
    .select("user_id, status, start_at, end_at")
    .in("user_id", studentIds)
    .eq("status", "active")
    .lte("start_at", nowIso)
    .gte("end_at", nowIso)
    .returns<SubRow[]>();

  if (subsError) {
    console.error(subsError);
  }

  const activePremiumSet = new Set<string>();
  (subs || []).forEach((row) => {
    activePremiumSet.add(row.user_id);
  });

  // 5. ambil attempts semua murid
  const { data: attempts, error: attemptsError } = await supabase
    .from("question_attempts")
    .select("user_id, material_id, is_correct")
    .in("user_id", studentIds);

  if (attemptsError) {
    console.error(attemptsError);
  }

  // 6. hitung statistik per murid
  type StudentStats = {
    student: StudentRow;
    totalAttempts: number;
    correct: number;
    materialsCount: number;
    accuracy: number | null;
  };

  const statsByStudent = new Map<string, StudentStats>();

  students.forEach((s) => {
    statsByStudent.set(s.id, {
      student: s,
      totalAttempts: 0,
      correct: 0,
      materialsCount: 0,
      accuracy: null,
    });
  });

  // untuk hitung jumlah materi unik per murid
  const materialsPerStudent = new Map<string, Set<number>>();

  (attempts || []).forEach(
    (row: { user_id: string; material_id: number; is_correct: boolean }) => {
      const uid = row.user_id;
      const mid = row.material_id;
      const isCorrect = row.is_correct;

      const stat = statsByStudent.get(uid);
      if (!stat) return;

      stat.totalAttempts += 1;
      if (isCorrect) stat.correct += 1;

      if (!materialsPerStudent.has(uid)) {
        materialsPerStudent.set(uid, new Set<number>());
      }
      materialsPerStudent.get(uid)!.add(mid);
    }
  );

  statsByStudent.forEach((stat, uid) => {
    const set = materialsPerStudent.get(uid);
    stat.materialsCount = set ? set.size : 0;
    if (stat.totalAttempts > 0) {
      stat.accuracy = Math.round((stat.correct / stat.totalAttempts) * 100);
    } else {
      stat.accuracy = null;
    }
  });

  const statsList = Array.from(statsByStudent.values());

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            Dashboard Guru 👩‍🏫👨‍🏫
          </h1>
          <p className="mt-1 text-xs text-slate-300">
            Lihat perkembangan murid berdasarkan materi dan jawaban soal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/register"
            className="rounded-xl border border-emerald-400/70 bg-emerald-500/30 px-3 py-2 text-[11px] font-semibold text-emerald-50 shadow-sm shadow-emerald-500/40 hover:bg-emerald-500/50"
            target="_blank"
          >
            + Tambah murid
          </Link>
          <div className="rounded-2xl bg-slate-900/80 px-3 py-2 text-[10px] text-slate-200 border border-slate-700/70">
            <div className="font-semibold flex items-center gap-1">
              📊 Ringkasan kelas
            </div>
            <div className="text-[9px] text-slate-400">
              Klik salah satu murid untuk melihat detail per materi.
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statsList.map(
          ({ student, totalAttempts, correct, materialsCount, accuracy }) => {
            const name =
              student.full_name && student.full_name.trim().length > 0
                ? student.full_name
                : "Tanpa nama";

            const gradeLabel = student.grade_id
              ? `Kelas ${student.grade_id}`
              : "Kelas belum di-set";

            // status premium: dari subscriptions (utama), fallback ke profiles.is_premium
            const hasActiveSub = activePremiumSet.has(student.id);
            const isPremium = hasActiveSub || !!student.is_premium;

            let badgeText = "Belum mengerjakan soal";
            let badgeColor =
              "bg-slate-700/60 text-slate-200 border-slate-500/70";
            if (accuracy !== null && accuracy >= 80) {
              badgeText = "Sangat baik ⭐";
              badgeColor =
                "bg-emerald-600/30 text-emerald-100 border-emerald-400/70";
            } else if (accuracy !== null && accuracy >= 50) {
              badgeText = "Cukup, perlu latihan";
              badgeColor = "bg-cyan-600/30 text-cyan-100 border-cyan-400/70";
            } else if (accuracy !== null) {
              badgeText = "Perlu pendampingan";
              badgeColor = "bg-red-600/30 text-red-100 border-red-400/70";
            }

            const premiumLabel = isPremium ? "Premium ⭐" : "Gratis 🎁";
            const premiumColor = isPremium
              ? "text-amber-300"
              : "text-slate-300";

            return (
              <div
                key={student.id}
                className="relative overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/80 p-4 shadow-lg shadow-black/40"
              >
                <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wide">
                  <span className="rounded-full bg-pink-500/20 px-2 py-1 text-pink-200">
                    {gradeLabel}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-1 ${badgeColor}`}
                  >
                    {badgeText}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-white">{name}</h2>
                    <p className="mt-1 text-[11px] text-slate-400">
                      ID: {student.id.slice(0, 8)}...
                    </p>

                    <div className="mt-1 text-[11px]">
                      <span className="text-slate-400">Status: </span>
                      <span className={premiumColor}>{premiumLabel}</span>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                      <div className="rounded-xl bg-slate-800/80 p-2 text-center">
                        <div className="text-slate-400">Materi</div>
                        <div className="text-lg font-bold text-cyan-300">
                          {materialsCount}
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-800/80 p-2 text-center">
                        <div className="text-slate-400">Benar</div>
                        <div className="text-lg font-bold text-emerald-300">
                          {correct}
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-800/80 p-2 text-center">
                        <div className="text-slate-400">Total</div>
                        <div className="text-lg font-bold text-slate-100">
                          {totalAttempts}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-200">
                      <span>
                        Akurasi:{" "}
                        {accuracy === null ? (
                          <span className="text-slate-300">-</span>
                        ) : (
                          <span className="font-bold text-emerald-300">
                            {accuracy}%
                          </span>
                        )}
                      </span>
                      <Link
                        href={`/dashboard/teacher/students/${student.id}`}
                        className="ml-auto inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200"
                      >
                        Lihat detail{" "}
                        <span className="inline-block transition-transform group-hover:translate-x-1">
                          ➜
                        </span>
                      </Link>
                    </div>
                  </div>

                  {/* DULUNYA: StudentPremiumToggle di sini.
                      SEKARANG: Guru hanya MELIHAT status, tidak bisa mengubah. */}
                  <div className="text-right text-[11px]">
                    <div className={`font-semibold ${premiumColor}`}>
                      {premiumLabel}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Status premium diatur oleh admin.
                    </div>
                  </div>
                </div>

                <div className="pointer-events-none absolute -right-4 -bottom-4 h-16 w-16 rounded-full bg-linear-to-tr from-cyan-500/30 via-purple-500/30 to-pink-500/30 blur-xl" />
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}
