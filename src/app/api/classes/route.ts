// src/app/api/classes/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

type NextCookieStore = Awaited<ReturnType<typeof cookies>>;
function adapter(c: NextCookieStore) {
  return {
    get(name: string) {
      const ck = c.get(name);
      if (!ck) return null;
      return { name: ck.name, value: ck.value };
    },
    getAll() {
      return c.getAll().map((x) => ({ name: x.name, value: x.value }));
    },
    set() {},
    delete() {},
  };
}

export async function GET() {
  const c = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: adapter(c),
    }
  );

  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .order("id", { ascending: true });
  if (error) {
    console.error("fetch classes error", error);
    return NextResponse.json(
      { classes: [], error: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ classes: data || [] });
}
