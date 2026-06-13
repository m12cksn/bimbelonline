import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import GradeCardsClient from "./grade_cards_client";

export default async function AdminGradeCardsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-emerald-200 bg-linear-to-br from-emerald-900 via-emerald-700 to-lime-500 p-6 text-white shadow-lg md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-100">
          Pengaturan Dashboard Murid
        </p>
        <h1 className="mt-2 text-3xl font-extrabold">
          Kelola Kartu Kelas 1–12
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-emerald-50">
          Atur nama, deskripsi, dan gambar yang tampil pada kartu pilihan kelas
          di dashboard murid.
        </p>
      </section>

      <GradeCardsClient />
    </div>
  );
}
