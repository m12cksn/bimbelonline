// app/login/page.tsx
"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { createSupabaseClient } from "@/lib/supabaseClient";

const ALLOWED_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "yahoo.co.id",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
];

function isValidEmailDomain(email: string) {
  const parts = email.split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1].toLowerCase();

  if (domain === "mail.com" || domain === "asal.com") return false;
  return ALLOWED_DOMAINS.includes(domain);
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromCoding = searchParams.get("from") === "coding";
  const supabase = createSupabaseClient();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const cleanedEmail = email.trim().toLowerCase();

    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanedEmail,
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
      } else {
        if (!isValidEmailDomain(cleanedEmail)) {
          setErrorMsg(
            "Gunakan email sungguhan seperti @gmail.com, @yahoo.com, @outlook.com, dll. Email seperti iwan@mail.com atau iwan@asal.com tidak diterima."
          );
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: cleanedEmail,
          password,
          options: {
            data: { full_name: fullName },
          },
        });

        if (error) {
          setErrorMsg(error.message);
          return;
        }

        if (data.session && data.user) {
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert(
              {
                id: data.user.id,
                full_name: fullName,
                email: cleanedEmail,
                role: "student",
              },
              { onConflict: "id" }
            );

          if (profileError) {
            console.warn("profile upsert error", profileError);
          }

          router.push(fromCoding ? "/coding/start" : "/dashboard/student");
          router.refresh();
        } else {
          setErrorMsg(
            "Pendaftaran berhasil. Silakan login dengan email dan password yang tadi."
          );
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Terjadi kesalahan. Coba lagi ya.");
    } finally {
      setLoading(false);
    }
  }

  // LOGIN VIA GOOGLE
  async function handleGoogleLogin() {
    try {
      setErrorMsg(null);
      setLoadingGoogle(true);

      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        console.error(error);
        setErrorMsg(error.message);
      }
      // Supabase akan redirect otomatis ke Google,
      // lalu kembali ke /auth/callback, dan dari sana kamu bisa arahkan ke /dashboard/student
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal login dengan Google. Coba lagi ya.");
    } finally {
      setLoadingGoogle(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-emerald-50 via-slate-100 to-white text-slate-900">
      {/* Background dekorasi */}
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
            {mode === "login" ? "Halo, Ayo Belajar!" : "Ayo Gabung Dulu"}
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            {mode === "login"
              ? "Masuk dengan email dan password yang sudah terdaftar."
              : "Daftar dulu supaya bisa mengerjakan latihan seru setiap hari."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "register" && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Nama lengkap
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Contoh: Budi, Siti..."
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="contoh: nama@gmail.com"
            />
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
            <span>
              {loading
                ? "Sebentar ya..."
                : mode === "login"
                ? "Masuk Sekarang"
                : "Daftar Sekarang"}
            </span>
            {!loading ? null : null}
          </button>
        </form>

        {/* Divider */}
        <div className="mt-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-[10px] text-slate-500">atau masuk dengan</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Tombol Google Login */}

        <div className="mt-4 text-center">
          {mode === "login" ? (
            <p className="text-[11px] text-slate-600">
              Belum punya akun?{" "}
              <button
                type="button"
                className="font-semibold text-emerald-700 hover:text-emerald-600 underline underline-offset-2"
                onClick={() => setMode("register")}
              >
                Daftar dulu yuk
              </button>
            </p>
          ) : (
            <p className="text-[11px] text-slate-600">
              Sudah punya akun?{" "}
              <button
                type="button"
                className="font-semibold text-emerald-700 hover:text-emerald-600 underline underline-offset-2"
                onClick={() => setMode("login")}
              >
                Masuk sekarang
              </button>
            </p>
          )}
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
