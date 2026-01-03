// src/app/dashboard/student/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import UpcomingZoomWidget from "./_components/upcoming_zoom_widget";
import ScrollToFreeStart from "./_components/scroll_to_free_start";

type ProgressRow = {
  material_id: number;
  last_question_number: number;
  is_completed: boolean | null;
  updated_at: string;
  materials: {
    title: string;
  } | null;
};

type AttemptRow = {
  material_id: number;
  score: number;
  total_answered: number | null;
};

type QuestionAttemptRow = {
  material_id: number;
  question_id: string;
  attempt_number: number | null;
  is_correct: boolean;
  created_at: string | null;
};

type ActiveClassRow = {
  id: number;
  name: string;
  subject?: string | null;
};

type ZoomNotificationRow = {
  id: number;
  class_id: number;
  title: string | null;
  start_time: string;
};

export default async function StudentDashboardPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, is_premium")
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.email ||
    "Student";

  const isPremium = !!profile?.is_premium;

  // =====================================================
  // 1) Ambil progress materi siswa
  // =====================================================
  const { data: progressRowsRaw } = await supabase
    .from("student_material_progress")
    .select(
      "material_id, last_question_number, is_completed, updated_at, materials ( title )"
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const progressRows: ProgressRow[] = Array.isArray(progressRowsRaw)
    ? progressRowsRaw.map((row) => {
        const raw = row as Record<string, unknown>;
        const materialsValue = raw.materials;
        const materials = Array.isArray(materialsValue)
          ? (materialsValue[0] as Record<string, unknown> | undefined) ?? null
          : (materialsValue as Record<string, unknown> | null);

        return {
          material_id:
            typeof raw.material_id === "number" ? raw.material_id : 0,
          last_question_number:
            typeof raw.last_question_number === "number"
              ? raw.last_question_number
              : 0,
          is_completed:
            typeof raw.is_completed === "boolean" ? raw.is_completed : null,
          updated_at: typeof raw.updated_at === "string" ? raw.updated_at : "",
          materials:
            materials && typeof materials.title === "string"
              ? { title: materials.title }
              : null,
        };
      })
    : [];

  const totalCompleted =
    progressRows.filter((p) => p.is_completed === true).length ?? 0;

  const totalActiveMaterials = progressRows.length;

  const lastProgress = progressRows[0] ?? null;
  const lastMaterialId = lastProgress?.material_id ?? null;
  const lastMaterialTitle = lastProgress?.materials?.title ?? null;
  const lastQuestionNumber = lastProgress?.last_question_number ?? 0;

  // =====================================================
  // 2) Ambil ringkasan nilai terbaik
  // =====================================================
  const { data: attemptsRaw } = await supabase
    .from("material_attempts")
    .select("material_id, score, total_answered")
    .eq("user_id", user.id)
    .order("score", { ascending: false });

  const attempts = (attemptsRaw as AttemptRow[]) || [];

  let bestScore = attempts.length > 0 ? attempts[0].score ?? 0 : 0;
  let totalAttempts = attempts.length;

  if (attempts.length === 0) {
    const { data: qaRows, error: qaError } = await supabase
      .from("question_attempts")
      .select(
        "material_id, question_id, attempt_number, is_correct, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (qaError) {
      console.error("question_attempts fallback error:", qaError);
    }

    const latestByKey = new Map<string, QuestionAttemptRow>();
    (qaRows ?? []).forEach((row) => {
      const attemptNum =
        row.attempt_number === 2
          ? 2
          : row.attempt_number === 1 || row.attempt_number === 0
          ? 1
          : 1;
      const key = `${row.material_id}-${row.question_id}-${attemptNum}`;
      if (!latestByKey.has(key)) {
        latestByKey.set(key, row as QuestionAttemptRow);
      }
    });

    const scoresByMaterial = new Map<
      number,
      { correct: number; total: number }
    >();
    latestByKey.forEach((row) => {
      const stats = scoresByMaterial.get(row.material_id) ?? {
        correct: 0,
        total: 0,
      };
      stats.total += 1;
      if (row.is_correct) stats.correct += 1;
      scoresByMaterial.set(row.material_id, stats);
    });

    let computedBest = 0;
    scoresByMaterial.forEach((stats) => {
      if (stats.total === 0) return;
      const score = Math.round((stats.correct / stats.total) * 100);
      if (score > computedBest) computedBest = score;
    });

    bestScore = computedBest;
    totalAttempts = scoresByMaterial.size;
  }

  const formattedBestScore =
    typeof bestScore === "number" ? Math.round(bestScore) : 0;

  // =====================================================
  // 3) Kelas aktif + notifikasi
  // =====================================================
  const { data: classLinks } = await supabase
    .from("class_students")
    .select("class_id, classes ( id, name, subject )")
    .eq("student_id", user.id);

  const activeClasses: ActiveClassRow[] = Array.isArray(classLinks)
    ? classLinks
        .map((row) => {
          const raw = row as Record<string, unknown>;
          const classValue = raw.classes;
          const classObj = Array.isArray(classValue)
            ? (classValue[0] as Record<string, unknown> | undefined) ?? null
            : (classValue as Record<string, unknown> | null);

          const id =
            typeof classObj?.id === "number"
              ? classObj.id
              : typeof raw.class_id === "number"
              ? raw.class_id
              : 0;

          return {
            id,
            name:
              typeof classObj?.name === "string"
                ? classObj.name
                : `Kelas #${id || "-"}`,
            subject:
              typeof classObj?.subject === "string" ? classObj.subject : null,
          };
        })
        .filter((c) => c.id > 0)
    : [];

  const classIds = activeClasses.map((c) => c.id);

  const { data: zoomRows } =
    classIds.length > 0
      ? await supabase
          .from("class_zoom_sessions")
          .select("id, class_id, title, start_time")
          .in("class_id", classIds)
          .gte("start_time", new Date().toISOString())
          .order("start_time", { ascending: true })
          .limit(3)
      : { data: [] as ZoomNotificationRow[] };

  const { data: subscriptionRow } = await supabase
    .from("subscriptions")
    .select("end_at, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("end_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ end_at: string | null; status: string | null }>();

  const notifications: Array<{
    id: string;
    title: string;
    description: string;
    href?: string;
  }> = [];

  if (Array.isArray(zoomRows)) {
    zoomRows.forEach((z) => {
      notifications.push({
        id: `zoom-${z.id}`,
        title: z.title ?? "Jadwal Zoom",
        description: `Sesi Zoom dimulai ${new Date(z.start_time).toLocaleString(
          "id-ID",
          { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }
        )}`,
        href: `/dashboard/student/classes/${z.class_id}/zoom`,
      });
    });
  }

  if (subscriptionRow?.end_at) {
    const endAt = new Date(subscriptionRow.end_at);
    const now = new Date();
    const diffMs = endAt.getTime() - now.getTime();
    const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (remainingDays <= 7) {
      notifications.push({
        id: "subscription-expiring",
        title: "Masa aktif hampir habis",
        description: `Sisa ${Math.max(remainingDays, 0)} hari. Upgrade untuk
        tetap akses premium.`,
        href: "/dashboard/student/upgrade",
      });
    }
  }

  return (
    <div className="space-y-8">
      {!isPremium && <ScrollToFreeStart targetId="free-start" />}
      {/* =====================================================
          HEADER / HERO
      ====================================================== */}
      <section
        className="
        relative overflow-hidden rounded-xl
        bg-linear-to-br from-emerald-100 via-emerald-50 to-white
        border border-emerald-200
        p-6 md:p-8
      "
      >
        <div className="pointer-events-none absolute -left-10 top-0 h-40 w-40 rounded-full bg-emerald-300 blur-2xl" />
        <div className="pointer-events-none absolute -right-12 bottom-0 h-40 w-40 rounded-full bg-teal-300 blur-2xl" />

        <div className="relative z-10 space-y-4">
          <p className="text-xl md:text-2xl xl:text-3xl font-bold uppercase  text-slate-600">
            Student Dashboard
          </p>

          <h1 className="text-2xl font-bold text-emerald-900 md:text-3xl">
            Halo {displayName.split(" ")[0]} 👋
          </h1>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                isPremium
                  ? "border-amber-400/60 bg-amber-300 text-amber-800 shadow"
                  : "border-emerald-400/60 bg-emerald-100/80 text-emerald-900"
              }`}
            >
              <span className="shadow font-semibold">
                {isPremium ? "Premium Student ✨" : "Free Student"}
              </span>
            </span>
            {!isPremium && (
              <span className="text-[11px] text-slate-600">
                Upgrade untuk membuka lebih banyak soal
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
              Fokus belajar hari ini
            </span>
          </div>

          <p className="max-w-2xl text-slate-600 text-sm leading-relaxed">
            Pilih materi dan mulai latihan kapan pun kamu siap. Kerjakan soal
            tiap hari seperti game, makin lama makin kuat matematikanya! 💪🌟
          </p>

          {/* ✅ Tombol jadwal Zoom terdekat */}

          {!isPremium && (
            <div id="free-start" tabIndex={-1} className="mt-4 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-600 shadow-sm">
              <div className="flex flex-col gap-4 p-4 text-white md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
                    Kerjakan Materi Gratis
                  </p>
                  <p className="text-sm font-semibold text-white">
                    Mulai latihan singkat agar anak langsung fokus
                  </p>
                  <p className="text-[11px] text-emerald-50">
                    4 soal gratis dari materi Pecahan, cocok untuk pemanasan.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="/materials/1"
                    className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-amber-400/90 px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-white"
                  >
                    <span className="text-base">🚀</span>
                    Mulai latihan
                  </Link>
                  <Link
                    href="/materials"
                    className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-emerald-500/30 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500/50"
                  >
                    <span className="text-base">📚</span>
                    Pilih materi lain
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-between bg-emerald-700/80 px-4 py-2 text-[11px] text-emerald-50">
                <span>Soal gratis tersedia</span>
                <span className="font-semibold">4 soal</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          PROGRESS SUMMARY + LANJUTKAN MATERI TERAKHIR
      ====================================================== */}
      <section className="grid gap-4 md:grid-cols-3">
        {/* Ringkasan singkat progress */}
        <div
          className="
            rounded-lg border border-slate-200 bg-white
            px-5 py-4 shadow-sm
            flex flex-col justify-between
          "
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900 md:text-base">
              Progress Belajar
            </p>
            <span className="text-lg">📈</span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-emerald-900/80">
            <div>
              <p className="text-emerald-900 ">Materi selesai</p>
              <p className="mt-1 text-lg font-bold text-slate-600">
                {totalCompleted}
              </p>
            </div>
            <div>
              <p className="text-emerald-900">Materi aktif</p>
              <p className="mt-1 text-lg font-bold text-slate-600">
                {totalActiveMaterials}
              </p>
            </div>
            <div>
              <p className="text-emerald-900">Percobaan</p>
              <p className="mt-1 text-lg font-bold text-amber-800">
                {totalAttempts}
              </p>
            </div>
            <div>
              <p className="text-emerald-900">Skor terbaik</p>
              <p className="mt-1 text-lg font-bold text-emerald-900">
                {formattedBestScore}
                <span className="text-sm">%</span>
              </p>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-slate-600 leading-relaxed">
            Coba jaga kebiasaan latihan sedikit demi sedikit tiap hari. Nanti
            grafik ini bakal makin hijau 🌱.
          </p>
        </div>

        {/* Lanjutkan materi terakhir (jika ada) */}
        <div
          className="
            rounded-lg border border-slate-200 bg-white
            px-5 py-4 shadow-sm
            flex flex-col justify-between
          "
        >
          <div className="flex items-center justify-between">
            <p className=" font-semibold uppercase tracking-wide text-emerald-900">
              Lanjutkan latihan
            </p>
            <span className="text-lg">🎯</span>
          </div>

          {lastMaterialId ? (
            <>
              <div className="mt-3 space-y-1">
                <p className="text-sm font-semibold text-emerald-900 line-clamp-2">
                  {lastMaterialTitle ?? `Materi #${lastMaterialId}`}
                </p>
                <p className="text-xs text-slate-600">
                  Terakhir sampai soal{" "}
                  <span className="font-semibold text-slate-600">
                    #{lastQuestionNumber || 1}
                  </span>
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <Link
                  href={`/materials/${lastMaterialId}`}
                  className="
                    inline-flex flex-1 items-center justify-center gap-2
                    rounded-lg bg-emerald-600 hover:bg-emerald-500
                    px-4 py-2 text-xs md:text-sm font-semibold text-emerald-100
                    shadow-md shadow-emerald-500/30 transition
                  "
                >
                  🚀 Lanjutkan latihan
                </Link>
              </div>

              <p className="mt-2 text-[11px] text-slate-600/80">
                Bisa juga pilih materi lain di menu{" "}
                <span className="font-semibold text-slate-600">
                  Materi &amp; Latihan
                </span>
                .
              </p>
            </>
          ) : (
            <div className="mt-3 space-y-2">
              <p className="text-sm font-semibold text-emerald-900">
                Belum ada latihan yang dimulai
              </p>
              <p className="text-xs text-slate-600">
                Coba buka menu{" "}
                <span className="font-semibold text-emerald-900 bg-emerald-100 px-1 rounded-s-sm">
                  Materi &amp; Latihan
                </span>{" "}
                lalu pilih salah satu materi untuk mulai percobaan pertama.
              </p>
              <Link
                href="/materials"
                className="
                  mt-2 inline-flex items-center justify-center gap-2
                  rounded-lg bg-emerald-600 hover:bg-emerald-500
                  px-4 py-2 text-xs md:text-sm font-semibold text-white
                  shadow-md shadow-emerald-500/30 transition
                "
              >
                ✨ Mulai materi pertama
              </Link>
            </div>
          )}
        </div>

        {/* Kartu tips / motivasi singkat */}
        <div
          className="
            rounded-lg border border-slate-200 bg-white
            px-5 py-4 shadow-sm
            flex flex-col justify-between
          "
        >
          <div className="flex items-center justify-between">
            <p className=" font-semibold uppercase tracking-wide text-emerald-900">
              Tips Belajar
            </p>
            <span className="text-lg">💡</span>
          </div>

          <div className="mt-3 space-y-2 text-xs text-slate-600">
            <p>✅ Kerjakan 5-10 soal per hari, tidak perlu langsung banyak.</p>
            <p>✅ Kalau salah, jangan sedih. Baca penjelasan lalu coba lagi.</p>
            <p>
              ✅ Kalau bingung, tandai soal dan bahas bareng tutor saat Zoom.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          KELAS & MAPEL AKTIF + NOTIFIKASI
      ====================================================== */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">
              Kelas & Mapel Aktif
            </p>
            <Link
              href="/dashboard/student/classes"
              className="text-[11px] text-slate-600 hover:text-emerald-600"
            >
              Lihat semua
            </Link>
          </div>
          <div className="mt-3 space-y-3 text-sm text-slate-700">
            {activeClasses.length === 0 ? (
              <p className="text-xs text-slate-600">
                Belum ada kelas aktif. Hubungi admin untuk masuk kelas.
              </p>
            ) : (
              activeClasses.slice(0, 3).map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {c.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {c.subject ?? "Matematika"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">
              Notifikasi
            </p>
            <span className="text-[11px] text-slate-600">
              {notifications.length} terbaru
            </span>
          </div>
          <div className="mt-3 space-y-3 text-sm text-slate-700">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-600">
                Belum ada notifikasi baru.
              </p>
            ) : (
              notifications.slice(0, 4).map((n) => (
                <div
                  key={n.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {n.title}
                  </p>
                  <p className="text-xs text-slate-600">{n.description}</p>
                  {n.href && (
                    <Link
                      href={n.href}
                      className="mt-2 inline-flex text-[11px] text-slate-600 hover:text-emerald-600"
                    >
                      Buka
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          UPCOMING ZOOM WIDGET
      ====================================================== */}

      {/* =====================================================
          QUICK ACTION CARDS (tidak diubah, hanya dibiarkan)
      ====================================================== */}
      <section
        className="
        grid gap-4 sm:grid-cols-2 lg:grid-cols-3
      "
      >
        {/* My Classes */}
        <Link
          href="/dashboard/student/classes"
          className="
            group rounded-lg border border-emerald-200 
            bg-white/80
            hover:bg-emerald-100/60
            p-5 transition
            shadow-sm
            text-emerald-900
          "
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-200 text-lg">
              🗓️
            </span>
            <p className="font-semibold text-lg text-emerald-900">My Classes</p>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Lihat jadwal kelas Zoom dan ruang kelas kamu.
          </p>
        </Link>

        {/* Materi & Latihan */}
        <Link
          href="/materials"
          className="
            group rounded-lg border border-emerald-200 
            bg-white/80
            hover:bg-emerald-100/60
            p-5 transition
            shadow-sm
            text-emerald-900
          "
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-200 text-lg">
              📘
            </span>
            <p className="font-semibold text-lg text-emerald-900">
              Materi &amp; Latihan
            </p>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Pilih topik pelajaran dan kerjakan soal seperti game.
          </p>
        </Link>

        {/* Upgrade */}
        <Link
          href="/dashboard/student/upgrade"
          className="
            group rounded-lg border border-emerald-200 
            bg-white/80
            hover:bg-emerald-100/60
            p-5 transition
            shadow-sm
            text-emerald-900
          "
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-200 text-lg">
              🔥
            </span>
            <p className="font-semibold text-lg text-emerald-900">
              Upgrade Premium
            </p>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Buka lebih banyak soal, fitur video call, dan event khusus.
          </p>
        </Link>
      </section>
    </div>
  );
}
