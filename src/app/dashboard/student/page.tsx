// app/dashboard/student/page.tsx
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { UserRole } from "@/lib/type";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserSubscriptionStatus } from "@/lib/subcription";

type Material = {
  id: number;
  title: string;
  description: string | null;
};

const FREE_LIMIT = 8;

export default async function StudentDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const subscription = await getUserSubscriptionStatus();

  // 1. cek user login
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log("LOGGED USER ID:", user?.id);

  if (!user) {
    redirect("/login");
  }

  // 2. ambil profil (role + grade)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, grade_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/login");
  }

  const role = profile.role as UserRole;
  const gradeId = profile.grade_id as number | null;

  if (role !== "student") {
    if (role === "teacher") redirect("/dashboard/teacher");
    if (role === "admin") redirect("/dashboard/admin");
    redirect("/login");
  }

  // ✅ 3. ambil status premium dari tabel subscriptions (Milestone 3)
  const { isPremium, planName, endAt } = await getUserSubscriptionStatus();
  console.log("DASHBOARD SUB STATUS:", { isPremium, planName, endAt });

  // 3. ambil daftar materi
  let materialsQuery = supabase
    .from("materials")
    .select("id, title, description")
    .eq("is_active", true)
    .order("id", { ascending: true });

  if (gradeId) {
    materialsQuery = materialsQuery.eq("grade_id", gradeId);
  }

  const { data: materials, error: materialsError } = await materialsQuery;

  if (materialsError) {
    console.error(materialsError);
  }

  const materialList: Material[] = materials || [];

  if (materialList.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold text-white">
          Halo, siap latihan hari ini? 🌟
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Belum ada materi aktif untuk kelas kamu. Coba tanya gurumu ya. 🙂
        </p>
      </div>
    );
  }

  const materialIds = materialList.map((m) => m.id);

  // 4. ambil jumlah soal per materi
  const { data: questionRows, error: questionsError } = await supabase
    .from("questions")
    .select("material_id, question_number")
    .in("material_id", materialIds);

  if (questionsError) {
    console.error(questionsError);
  }

  // 5. ambil progress per materi untuk user ini
  const { data: progressRows, error: progressError } = await supabase
    .from("student_material_progress")
    .select("material_id, last_question_number")
    .eq("user_id", user.id)
    .in("material_id", materialIds);

  if (progressError) {
    console.error(progressError);
  }

  // 6. ambil attempt (benar/salah) per materi untuk user ini
  const { data: attemptRows, error: attemptsError } = await supabase
    .from("question_attempts")
    .select("material_id, is_correct")
    .eq("user_id", user.id)
    .in("material_id", materialIds);

  if (attemptsError) {
    console.error(attemptsError);
  }

  // mapping jumlah soal
  const totalQuestionsByMaterial = new Map<number, number>();
  (questionRows || []).forEach(
    (row: { material_id: number; question_number: number }) => {
      const mid = row.material_id;
      totalQuestionsByMaterial.set(
        mid,
        (totalQuestionsByMaterial.get(mid) ?? 0) + 1
      );
    }
  );

  // mapping progress (last question)
  const lastNumberByMaterial = new Map<number, number>();
  (progressRows || []).forEach(
    (row: { material_id: number; last_question_number: number }) => {
      const mid = row.material_id;
      const last = row.last_question_number;
      lastNumberByMaterial.set(mid, last);
    }
  );

  // mapping attempts: total dijawab & benar
  const attemptsCountByMaterial = new Map<number, number>();
  const correctCountByMaterial = new Map<number, number>();

  (attemptRows || []).forEach(
    (row: { material_id: number; is_correct: boolean }) => {
      const mid = row.material_id;
      const isCorrect = row.is_correct;

      attemptsCountByMaterial.set(
        mid,
        (attemptsCountByMaterial.get(mid) ?? 0) + 1
      );

      if (isCorrect) {
        correctCountByMaterial.set(
          mid,
          (correctCountByMaterial.get(mid) ?? 0) + 1
        );
      }
    }
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            Halo, siap latihan hari ini? 🌟
          </h1>
          <p className="mt-1 text-xs text-slate-300">
            Pilih materi di bawah ini dan lanjutkan dari soal terakhir yang kamu
            kerjakan.
          </p>

          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[11px]">
            <span className="text-slate-400">Status akun:</span>

            {subscription.isPremium ? (
              <span className="font-semibold text-amber-300">
                Premium ⭐
                {subscription.endAt && (
                  <>
                    {" "}
                    • aktif sampai{" "}
                    {new Date(subscription.endAt).toLocaleDateString("id-ID")}
                  </>
                )}
              </span>
            ) : subscription.isPending ? (
              <span className="font-semibold text-cyan-300">
                Upgrade diproses ⏳ (menunggu admin)
              </span>
            ) : (
              <span className="font-semibold text-emerald-300">
                Gratis 🎁 Soal 1–{FREE_LIMIT} saja
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {!subscription.isPremium && !subscription.isPending && (
            <Link
              href="/dashboard/student/upgrade"
              className="rounded-xl border border-amber-400/70 bg-amber-500/30 px-3 py-2 text-[11px] font-semibold text-amber-50 shadow-sm shadow-amber-500/40 hover:bg-amber-500/50"
            >
              🔓 Upgrade ke Premium
            </Link>
          )}
          {subscription.isPending && (
            <div className="mt-1 text-[11px] text-cyan-300">
              Permintaan upgrade kamu sedang diproses admin ⏳
            </div>
          )}
          <div className="rounded-2xl bg-slate-900/80 px-3 py-2 text-[10px] text-slate-200 border border-slate-700/70">
            <div className="font-semibold flex items-center gap-1">
              🔥 Mode Latihan
            </div>
            <div className="text-[9px] text-slate-400">
              Nilai dihitung dari jawaban yang sudah kamu kerjakan.
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {materialList.map((material, index) => {
          const totalQuestions = totalQuestionsByMaterial.get(material.id) ?? 0;
          const lastNumber = lastNumberByMaterial.get(material.id) ?? 0;

          const answered = Math.min(lastNumber, totalQuestions);
          const percentProgress =
            totalQuestions > 0
              ? Math.min(100, Math.round((answered / totalQuestions) * 100))
              : 0;

          const attempts = attemptsCountByMaterial.get(material.id) ?? 0;
          const correct = correctCountByMaterial.get(material.id) ?? 0;
          const wrong = Math.max(0, attempts - correct);

          // nilai sementara: berdasarkan jawaban yang sudah dikerjakan
          const score =
            attempts > 0 ? Math.round((correct / attempts) * 100) : null;

          let statusLabel = "Belum mulai";
          let statusColor = "text-slate-300";

          if (totalQuestions === 0) {
            statusLabel = "Belum ada soal";
            statusColor = "text-slate-400";
          } else if (answered === 0) {
            statusLabel = "Belum mulai";
            statusColor = "text-slate-300";
          } else if (answered < totalQuestions) {
            if (!isPremium && answered >= FREE_LIMIT) {
              statusLabel = "Selesai soal gratis (butuh premium)";
              statusColor = "text-yellow-300";
            } else {
              statusLabel = `Berjalan (soal ${answered + 1})`;
              statusColor = "text-cyan-300";
            }
          } else {
            statusLabel = "Selesai semua 🎉";
            statusColor = "text-emerald-300";
          }

          return (
            <Link
              key={material.id}
              href={`/materials/${material.id}`}
              className="group relative block overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/80 p-4 shadow-lg shadow-black/40 transition transform hover:-translate-y-1 hover:scale-[1.01]"
            >
              {/* badge kecil */}
              <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wide">
                <span className="rounded-full bg-pink-500/20 px-2 py-1 text-pink-200">
                  Materi {index + 1}
                </span>
                <span className="rounded-full bg-cyan-500/15 px-2 py-1 text-cyan-200">
                  {totalQuestions > 0
                    ? `${totalQuestions} soal`
                    : "Belum ada soal"}
                </span>
              </div>

              <h2 className="text-base font-bold text-white">
                {material.title}
              </h2>
              {material.description && (
                <p className="mt-1 line-clamp-2 text-xs text-slate-300">
                  {material.description}
                </p>
              )}

              {/* status & progress bar */}
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className={statusColor}>{statusLabel}</span>
                  {totalQuestions > 0 && (
                    <span className="text-slate-400">
                      {answered}/{totalQuestions} soal
                    </span>
                  )}
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-cyan-400 via-purple-400 to-pink-400 transition-all duration-500"
                    style={{ width: `${percentProgress}%` }}
                  />
                </div>
              </div>

              {/* nilai & benar/salah */}
              <div className="mt-3 flex items-center justify-between text-[11px]">
                {attempts > 0 ? (
                  <div className="flex flex-col">
                    <span className="text-slate-200">
                      Nilai sementara:{" "}
                      <span className="font-bold text-emerald-300">
                        {score}
                      </span>
                    </span>
                    <span className="text-slate-400">
                      {correct} benar, {wrong} salah
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-400">
                    Belum ada jawaban. Yuk mulai kerjakan 🎯
                  </span>
                )}

                <span className="flex items-center gap-1 text-cyan-300 group-hover:text-cyan-200">
                  Kerjakan{" "}
                  <span className="inline-block transition-transform group-hover:translate-x-1">
                    ➜
                  </span>
                </span>
              </div>

              {/* dekorasi sudut */}
              <div className="pointer-events-none absolute -right-4 -bottom-4 h-16 w-16 rounded-full bg-linear-to-tr from-cyan-500/30 via-purple-500/30 to-pink-500/30 blur-xl" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
