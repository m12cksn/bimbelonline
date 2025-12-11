// lib/supabaseServer.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createSupabaseServerClient() {
  // DI VERSI NEXT KAMU, cookies() → Promise, jadi WAJIB di-await
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // kalau env kamu masih pakai ANON_KEY, pakai ini:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // kalau nanti pakai nama baru PUBLISHABLE_KEY, tinggal diganti saja
    {
      cookies: {
        // Supabase minta implementasi getAll & setAll, BUKAN get
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Dipanggil dari Server Component biasanya akan error set cookie,
            // tapi ini boleh di-abaikan (sesuai docs Supabase).
          }
        },
      },
    }
  );
}
