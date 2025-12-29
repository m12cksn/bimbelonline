import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import CodingRegistrationsTable from "../_components/CodingRegistrationsTable";

type CodingRegistrationRow = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  package_name: string;
  package_code: string;
  total_sessions: number;
  price_idr: number;
  status: string;
  notes: string | null;
  payment_status: string | null;
  payment_proof_url: string | null;
  paid_at: string | null;
  created_at: string;
};

export default async function AdminCodingRegistrationsPage() {
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

  const { data: registrationsRaw, error } = await supabase
    .from("coding_registrations")
    .select(
      "id, user_id, full_name, phone, package_name, package_code, total_sessions, price_idr, status, notes, payment_status, payment_proof_url, paid_at, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("coding registrations error", error);
  }

  const registrations = (registrationsRaw ?? []) as CodingRegistrationRow[];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.25)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Pendaftaran Coding
            </h1>
            <p className="text-xs text-slate-500">
              Approve atau decline pendaftar kelas coding.
            </p>
          </div>
          <span className="text-[11px] text-slate-500">
            Total pendaftar: {registrations.length}
          </span>
        </div>

        <CodingRegistrationsTable rows={registrations} />
      </section>
    </div>
  );
}
