"use client";

import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      aria-label="Logout"
      title="Logout"
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/50 bg-red-300 shadow text-slate-800 transition hover:bg-red-500/40"
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M9 5h6a2 2 0 012 2v2" />
        <path d="M15 19H9a2 2 0 01-2-2v-2" />
        <path d="M13 12H3" />
        <path d="M6 9l-3 3 3 3" />
      </svg>
    </button>
  );
}
