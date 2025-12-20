// app/login/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseClient();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ... state dll sama persis

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const cleanedEmail = email.trim().toLowerCase();

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanedEmail,
          password,
        });

        if (error) {
          setErrorMsg(error.message);
          return;
        }

        router.push("/dashboard/student");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: cleanedEmail,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) {
          setErrorMsg(error.message);
          return;
        }

        if (data.session) {
          router.push("/dashboard/student");
          router.refresh();
        } else {
          setErrorMsg(
            "Pendaftaran berhasil. Silakan cek email untuk konfirmasi, lalu login kembali."
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

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-slate-950 text-slate-50">
      {/* Background dekorasi */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-64 w-64 rounded-full bg-purple-600/40 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-72 w-72 rounded-full bg-cyan-500/40 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rotate-12 rounded-3xl border border-dashed border-pink-400/40" />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-3xl bg-slate-900/80 p-6 shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-slate-700/60 backdrop-blur">
        <div className="mb-4 flex flex-col items-center">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-linear-to-br from-pink-500 via-purple-500 to-cyan-400 text-2xl shadow-lg animate-bounce">
              🎓
            </span>
            <span className="rounded-full bg-slate-800/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-300">
              Bimbel Kids Online
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            {mode === "login" ? "Halo, Ayo Belajar!" : "Ayo Gabung Dulu 😄"}
          </h1>
          <p className="mt-1 text-xs text-slate-300">
            {mode === "login"
              ? "Masuk dengan email & password yang sudah terdaftar."
              : "Daftar dulu supaya bisa mengerjakan latihan seru setiap hari."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "register" && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-200">
                Nama lengkap
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Contoh: Budi, Siti..."
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-200">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="contoh: kamu@mail.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-200">
              Password
            </label>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Minimal 6 karakter"
            />
          </div>

          {errorMsg && (
            <div className="rounded-xl bg-red-500/15 px-3 py-2 text-xs text-red-200 border border-red-500/40">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-pink-500 via-purple-500 to-cyan-400 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/40 transition hover:scale-[1.02] hover:shadow-cyan-500/40 disabled:opacity-60"
          >
            <span>
              {loading
                ? "Sebentar ya..."
                : mode === "login"
                ? "Masuk Sekarang"
                : "Daftar Sekarang"}
            </span>
            {!loading && <span className="animate-bounce">⭐</span>}
          </button>
        </form>

        <div className="mt-4 text-center">
          {mode === "login" ? (
            <p className="text-[11px] text-slate-300">
              Belum punya akun?{" "}
              <button
                type="button"
                className="font-semibold text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
                onClick={() => setMode("register")}
              >
                Daftar dulu yuk
              </button>
            </p>
          ) : (
            <p className="text-[11px] text-slate-300">
              Sudah punya akun?{" "}
              <button
                type="button"
                className="font-semibold text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
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
