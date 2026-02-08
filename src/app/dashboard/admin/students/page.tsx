import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import StudentsTable from "../_components/students_table";
import CreateStudentForm from "../_components/create_student_form";

type StudentProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string | null;
  is_premium: boolean | null;
};

type SubscriptionRow = {
  id: string;
  user_id: string;
  plan_id: string | null;
  start_at: string | null;
  end_at: string | null;
  subscription_plans:
    | { name: string | null; code: string | null }
    | Array<{ name: string | null; code: string | null }>
    | null;
};

const PAGE_SIZE = 25;

type PageProps = {
  searchParams?: Promise<{ page?: string }>;
};

type GradeRow = {
  id: number;
  name: string;
  level: number;
};

type StudentGradeRow = {
  student_id: string;
  grade_id: number;
};

export default async function AdminStudentsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    redirect("/dashboard/student");
  }

  const currentPage = Math.max(
    1,
    Number.parseInt(resolvedSearchParams.page ?? "1", 10) || 1
  );
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: studentsRaw, count } = await supabase
    .from("profiles")
    .select("id, full_name, email, created_at, is_premium", {
      count: "exact",
    })
    .eq("role", "student")
    .order("created_at", { ascending: false })
    .range(from, to);

  const students = (studentsRaw ?? []) as StudentProfileRow[];
  const { data: gradesRaw } = await supabase
    .from("grades")
    .select("id, name, level")
    .order("level", { ascending: true });
  const grades = (gradesRaw ?? []) as GradeRow[];
  const studentIds = students.map((s) => s.id);
  const { data: studentGradesRaw } =
    studentIds.length > 0
      ? await supabase
          .from("student_grades")
          .select("student_id, grade_id")
          .in("student_id", studentIds)
      : { data: [] };
  const studentGrades = (studentGradesRaw ?? []) as StudentGradeRow[];
  const gradeMap = new Map<string, number[]>();
  studentGrades.forEach((row) => {
    const list = gradeMap.get(row.student_id) ?? [];
    list.push(row.grade_id);
    gradeMap.set(row.student_id, list);
  });

  const { data: subscriptionsRaw } =
    studentIds.length > 0
      ? await supabase
          .from("subscriptions")
          .select(
            `
              id,
              user_id,
              plan_id,
              start_at,
              end_at,
              subscription_plans!subscriptions_plan_id_fkey (
                name,
                code
              )
            `
          )
          .in("user_id", studentIds)
          .eq("status", "active")
          .order("end_at", { ascending: false })
      : { data: [] };

  const subscriptions = (subscriptionsRaw ?? []) as SubscriptionRow[];
  const subByUser = new Map<string, SubscriptionRow>();
  subscriptions.forEach((sub) => {
    if (!subByUser.has(sub.user_id)) {
      subByUser.set(sub.user_id, sub);
    }
  });

  const formatDate = (value: string | null) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const now = Date.now();
  const studentRows = students.map((student) => {
    const sub = subByUser.get(student.id) ?? null;
    const endAt = sub?.end_at ?? null;
    const remainingDays = endAt
      ? Math.max(
          0,
          Math.ceil((new Date(endAt).getTime() - now) / (1000 * 60 * 60 * 24))
        )
      : null;

    return {
      id: student.id,
      name: student.full_name || student.email || "Siswa",
      isPremium: student.is_premium === true,
      remainingDays,
      subscriptionId: sub?.id ?? null,
      gradeIds: gradeMap.get(student.id) ?? [],
    };
  });

  const total = count ?? studentRows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-[0_20px_60px_-45px_rgba(0,0,0,1)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Tambah akun siswa
            </h2>
            <p className="text-xs text-slate-500">
              Buat username & password yang akan dikirim manual ke siswa.
            </p>
          </div>
        </div>
        <CreateStudentForm grades={grades} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-[0_20px_60px_-45px_rgba(0,0,0,1)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Daftar Siswa
            </h1>
            <p className="text-xs text-slate-500">
              Pantau status paket, masa berlaku, dan reset subscription jika
              diperlukan.
            </p>
          </div>
          <span className="text-[11px] text-slate-500">
            Total siswa: {total}
          </span>
        </div>

        <StudentsTable rows={studentRows} grades={grades} />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Halaman {currentPage} dari {totalPages}
          </div>
          <div className="flex gap-2">
            <Link
              href={`/dashboard/admin/students?page=${Math.max(
                1,
                currentPage - 1
              )}`}
              className={`rounded-lg border px-3 py-1.5 ${
                currentPage <= 1
                  ? "pointer-events-none border-slate-200 text-slate-600"
                  : "border-slate-200 text-slate-700 hover:border-cyan-400"
              }`}
            >
              Sebelumnya
            </Link>
            <Link
              href={`/dashboard/admin/students?page=${Math.min(
                totalPages,
                currentPage + 1
              )}`}
              className={`rounded-lg border px-3 py-1.5 ${
                currentPage >= totalPages
                  ? "pointer-events-none border-slate-200 text-slate-600"
                  : "border-slate-200 text-slate-700 hover:border-cyan-400"
              }`}
            >
              Berikutnya
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
