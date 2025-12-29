// app/dashboard/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { UserRole } from "@/lib/type";
import DashboardShell from "@/app/components/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (error && !profile) {
    try {
      const fallbackRole =
        (user.user_metadata?.role as UserRole | undefined) ||
        ((user as any)?.app_metadata?.role as UserRole | undefined) ||
        "student";
      const fallbackName =
        user.user_metadata?.full_name || user.email || "Siswa";

      await supabase.from("profiles").upsert(
        {
          id: user.id,
          full_name: fallbackName,
          email: user.email,
          role: fallbackRole,
        },
        { onConflict: "id" }
      );
    } catch (insertErr) {
      console.warn("profiles upsert error", insertErr);
    }
  }

  const role =
    (profile?.role as UserRole | undefined) ||
    (user.user_metadata?.role as UserRole | undefined) ||
    ((user as any)?.app_metadata?.role as UserRole | undefined) ||
    "student";

  const name =
    profile?.full_name || user.user_metadata?.full_name || user.email || "Siswa";

  if (error) {
    console.warn("profiles fetch error", error);
  }

  return (
    <DashboardShell name={name} role={role}>
      {children}
    </DashboardShell>
  );
}
