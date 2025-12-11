// app/materials/[id]/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { UserRole } from "@/lib/type";
import MaterialWithResources from "./material_client";
import { getUserSubscriptionStatus } from "@/lib/subcription";

// Perhatikan: params sekarang bertipe Promise
interface MaterialPageProps {
  params: Promise<{ id: string }>;
}

export default async function MaterialPage(props: MaterialPageProps) {
  const { id } = await props.params;

  const materialId = parseInt(id, 10);
  if (Number.isNaN(materialId)) {
    redirect("/dashboard/student");
  }

  const supabase = await createSupabaseServerClient();

  // 1. cek user login
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. cek role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) redirect("/login");

  const role = profile.role as UserRole;
  if (role !== "student") {
    if (role === "teacher") redirect("/dashboard/teacher");
    if (role === "admin") redirect("/dashboard/admin");
    redirect("/login");
  }
  // ✅ Ambil status premium dari sistem subscription Milestone 3
  const { isPremium } = await getUserSubscriptionStatus();

  // 3. ambil info materi (+ video + pdf)
  const { data: material, error: materialError } = await supabase
    .from("materials")
    .select("id, title, description, video_url, pdf_url")
    .eq("id", materialId)
    .single();

  if (materialError || !material) {
    redirect("/dashboard/student");
  }

  // 4. ambil daftar soal
  const { data: questions, error: questionError } = await supabase
    .from("questions")
    .select("id, question_number, text, options")
    .eq("material_id", materialId)
    .order("question_number", { ascending: true });

  if (questionError) {
    console.error(questionError);
  }

  // 5. ambil progress
  const { data: progress } = await supabase
    .from("student_material_progress")
    .select("last_question_number")
    .eq("user_id", user.id)
    .eq("material_id", materialId)
    .single();

  const lastQuestionNumber = progress?.last_question_number ?? 0;

  return (
    <MaterialWithResources
      material={material}
      questions={questions || []}
      initialLastNumber={lastQuestionNumber}
      userId={user.id}
      isPremium={isPremium}
    />
  );
}
