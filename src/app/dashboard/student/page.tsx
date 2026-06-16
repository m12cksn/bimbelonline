import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { mergeGradeCards } from "@/lib/gradeCards";

export default async function StudentDashboardPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.email ||
    "Siswa";

  let gradeRows: Array<{
    id?: number | null;
    level?: number | null;
    name?: string | null;
    description?: string | null;
    image_url?: string | null;
  }> = [];

  const { data: configuredGrades, error: configuredError } = await supabase
    .from("grades")
    .select("id, level, name, description, image_url")
    .order("level", { ascending: true });

  if (!configuredError) {
    gradeRows = configuredGrades ?? [];
  } else {
    const { data: basicGrades, error: basicError } = await supabase
      .from("grades")
      .select("id, level, name")
      .order("level", { ascending: true });

    if (basicError) {
      console.error("student dashboard grades error:", basicError);
    } else {
      gradeRows = basicGrades ?? [];
    }
  }

  const gradeCards = mergeGradeCards(gradeRows);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-emerald-200 bg-linear-to-br from-emerald-900 via-emerald-700 to-lime-500 p-6 text-white md:p-9">
        <div className="pointer-events-none absolute -left-16 top-0 h-52 w-52 rounded-full bg-lime-300/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-cyan-300/25 blur-3xl" />

        <div className="relative z-10 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-100">
            BesmartKids Learning Space
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">
            Halo, {displayName.split(" ")[0]}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-emerald-50 md:text-base">
            Untuk mulai mengakses materi dan mengerjakan soal latihan, silakan
            pilih kelas melalui kartu di bawah ini.
          </p>
        </div>
      </section>

      <section className="space-y-5 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
              Pilih Tingkat Kelas
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
              Materi Kelas 1 sampai Kelas 12
            </h2>
          </div>
          <p className="max-w-md text-sm text-slate-500">
            Klik salah satu kelas untuk melihat seluruh materi dan latihan soal
            yang tersedia.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {gradeCards.map((grade) => (
            <Link
              key={grade.level}
              href={`/dashboard/student/grades/${grade.level}/materials`}
              className="group overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-[0_20px_60px_-38px_rgba(6,78,59,0.35)] transition duration-300 hover:-translate-y-1.5 hover:border-emerald-300 hover:shadow-[0_26px_70px_-38px_rgba(5,150,105,0.5)]"
            >
              <div className="relative aspect-[8/5] overflow-hidden bg-emerald-100">
                <Image
                  src={grade.imageUrl}
                  alt={`Ilustrasi ${grade.name}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-emerald-950/50 via-transparent to-transparent" />
                <span className="absolute bottom-4 left-4 rounded-md border border-white/30 bg-white/90 px-3 py-1 text-xs font-extrabold text-emerald-800 backdrop-blur">
                  Tingkat {grade.level}
                </span>
              </div>

              <div className="p-5">
                <h3 className="text-xl font-extrabold text-slate-900">
                  {grade.name}
                </h3>
                <p className="mt-2 line-clamp-3 min-h-[4.5rem] text-sm leading-relaxed text-slate-600">
                  {grade.description}
                </p>
                <div className="mt-5 flex items-center justify-between border-t border-emerald-100 pt-4">
                  <span className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                    Lihat materi
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-600 font-bold text-white transition group-hover:translate-x-1 group-hover:bg-emerald-500">
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
