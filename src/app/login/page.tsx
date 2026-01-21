// app/login/page.tsx
"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { createSupabaseClient } from "@/lib/supabaseClient";

function isEmail(value: string) {
  return value.includes("@");
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromCoding = searchParams.get("from") === "coding";
  const supabase = createSupabaseClient();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const cleanedIdentifier = identifier.trim().toLowerCase();

    try {
      let loginEmail = cleanedIdentifier;
      if (!isEmail(cleanedIdentifier)) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("email")
          .eq("username", cleanedIdentifier)
          .maybeSingle<{ email: string | null }>();

        if (profileError) {
          setErrorMsg("Gagal menemukan username. Coba lagi ya.");
          return;
        }

        if (!profile?.email) {
          setErrorMsg("Username tidak ditemukan. Hubungi admin.");
          return;
        }

        loginEmail = profile.email;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      let target = fromCoding ? "/coding/start" : "/dashboard/student";
      try {
        if (data.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .single();

          const role =
            profile?.role ||
            (data.user.user_metadata?.role as string | undefined) ||
            ((data.user as any)?.app_metadata?.role as string | undefined);

          if (role === "admin") {
            target = "/dashboard/admin";
          } else if (role === "teacher") {
            target = "/dashboard/teacher";
          } else if (role === "student" && fromCoding) {
            const { data: codingApproved } = await supabase
              .from("coding_registrations")
              .select("id, status")
              .eq("user_id", data.user.id)
              .eq("status", "approved")
              .limit(1)
              .maybeSingle<{ id: string; status: string }>();

            if (codingApproved) {
              target = "/dashboard/student";
            } else {
              target = "/coding/start";
            }
          }
        }
      } catch {
        // fallback to student dashboard
      }

      router.push(target);
      router.refresh();
    } catch (err) {
      console.error(err);
      setErrorMsg("Terjadi kesalahan. Coba lagi ya.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-emerald-50 via-slate-100 to-white text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-64 w-64 rounded-full bg-emerald-300/40 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-72 w-72 rounded-full bg-cyan-300/40 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rotate-12 rounded-3xl border border-dashed border-emerald-200/60" />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.25)]">
        <div className="mb-4 flex flex-col items-center">
          <Image
            src="/images/logo_horizontal.png"
            alt="BeSmartKids"
            width={180}
            height={48}
            className="mb-3 h-12 w-auto"
            priority
          />
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
              Bimbel Kids Online
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Halo, Ayo Belajar!
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Masuk dengan username dan password dari admin.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Username
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              placeholder="contoh: budi123"
            />
            <p className="mt-1 text-[10px] text-slate-500">
              Jika admin memberi email sebagai username, kamu bisa pakai email.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Password
            </label>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Minimal 6 karakter"
            />
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 disabled:opacity-60"
          >
            <span>{loading ? "Sebentar ya..." : "Masuk Sekarang"}</span>
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-600">
            Belum punya akun? Hubungi admin untuk mendapatkan username &
            password.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
