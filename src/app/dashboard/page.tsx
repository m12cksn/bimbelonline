// app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { UserRole } from "@/lib/type";

export default async function DashboardIndexPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error) {
    console.warn("profiles fetch error", error);
  }

  const role =
    (profile?.role as UserRole | undefined) ||
    (user.user_metadata?.role as UserRole | undefined) ||
    ((user as { app_metadata?: { role?: UserRole } })?.app_metadata?.role as
      | UserRole
      | undefined) ||
    "student";

  if (role === "student") redirect("/dashboard/student");
  if (role === "teacher") redirect("/dashboard/teacher");
  if (role === "admin") redirect("/dashboard/admin");

  redirect("/login");
}
