import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { defaultGradeCards, mergeGradeCards } from "@/lib/gradeCards";
import MaterialCards, { type GradeMaterial } from "./material_cards";

type PageProps = {
  params: Promise<{ level: string }>;
};

export default async function StudentGradeMaterialsPage({ params }: PageProps) {
  const { level: rawLevel } = await params;
  const level = Number(rawLevel);

  if (!Number.isInteger(level) || level < 1 || level > 12) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let gradeRow: {
    id?: number | null;
    level?: number | null;
    name?: string | null;
    description?: string | null;
    image_url?: string | null;
  } | null = null;

  const { data: configuredGrade, error: configuredError } = await supabase
    .from("grades")
    .select("id, level, name, description, image_url")
    .eq("level", level)
    .maybeSingle();

  if (!configuredError) {
    gradeRow = configuredGrade;
  } else {
    const { data: basicGrade } = await supabase
      .from("grades")
      .select("id, level, name")
      .eq("level", level)
      .maybeSingle();
    gradeRow = basicGrade;
  }

  const grade =
    mergeGradeCards(gradeRow ? [gradeRow] : []).find(
      (item) => item.level === level,
    ) ?? defaultGradeCards[level - 1];

  const gradeId =
    typeof gradeRow?.id === "number" ? gradeRow.id : grade.level;

  const { data: materialRows, error: materialsError } = await supabase
    .from("materials")
    .select("id, title, description, image_url, video_url, subject_id")
    .eq("grade_id", gradeId)
    .order("id", { ascending: true });

  if (materialsError) {
    console.error("grade materials error:", materialsError);
  }

  const materials = (materialRows ?? []) as GradeMaterial[];

  return (
    <div className="space-y-7">
      <Link
        href="/dashboard/student"
        className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
      >
        ← Kembali ke pilihan kelas
      </Link>

      <section className="relative overflow-hidden rounded-lg border border-emerald-200 bg-white shadow-[0_22px_70px_-42px_rgba(6,78,59,0.4)]">
        <div className="grid md:grid-cols-[320px_1fr]">
          <div className="relative min-h-56 overflow-hidden bg-emerald-100 md:min-h-72">
            <Image
              src={grade.imageUrl}
              alt={`Ilustrasi ${grade.name}`}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 320px"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center p-6 md:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-700">
              Daftar Materi
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
              {grade.name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
              {grade.description}
            </p>
            <p className="mt-5 text-sm font-semibold text-emerald-700">
              {materials.length} materi tersedia
            </p>
          </div>
        </div>
      </section>

      {level === 1 && (
        <Link
          href="/dashboard/student/grades/1/bab-5"
          className="block rounded-xl border border-emerald-300 bg-emerald-50 p-5 transition hover:bg-emerald-100"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Bab 5 · Kelas 1</span>
          <h2 className="mt-1 text-xl font-extrabold text-emerald-950">Ayo Membilang sampai 20</h2>
          <p className="mt-1 text-sm text-emerald-800">4 materi, 48 soal latihan, dan 20 soal evaluasi. Buka materi dan latihan →</p>
        </Link>
      )}

      {materials.length === 0 ? (
        <section className="rounded-lg border border-dashed border-emerald-300 bg-white p-10 text-center">
          <div className="text-4xl">📚</div>
          <h2 className="mt-3 text-xl font-bold text-slate-900">
            Materi belum tersedia
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Materi untuk {grade.name} sedang disiapkan dan akan segera tampil.
          </p>
        </section>
      ) : (
        <MaterialCards materials={materials} />
      )}
    </div>
  );
}
