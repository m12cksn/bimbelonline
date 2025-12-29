// lib/supabaseServer.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieEncoding: "base64url",
      cookies: {
        getAll() {
          if (typeof cookieStore.getAll === "function") {
            return cookieStore.getAll();
          }
          return [];
        },
        setAll(cookiesToSet) {
          if (typeof cookieStore.set !== "function") return;

          try {
            cookiesToSet.forEach((cookie) => {
              cookieStore.set(cookie.name, cookie.value, cookie.options);
            });
          } catch {
            // ignore write failures in RSC
          }
        },
      },
    }
  );
}
