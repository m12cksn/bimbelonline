// src/app/api/adm/profiles/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type RawRow = Record<string, unknown>;

function getStringFromRow(
  row: RawRow,
  keys: string[],
  fallback: string | null = null
) {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim() !== "") return v;
  }
  return fallback;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const role = url.searchParams.get("role");

    const supabase = await createSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user ?? null;
    if (!user)
      return NextResponse.json(
        { ok: false, error: "Unauthenticated" },
        { status: 401 }
      );

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // ambil semua kolom (safe)
    let query = supabase.from("profiles").select("*");
    if (role) query = query.eq("role", role);

    const { data, error } = await query;
    if (error) {
      console.error("fetch profiles error", error);
      return NextResponse.json(
        { ok: false, error: "Failed to fetch profiles" },
        { status: 500 }
      );
    }

    const rows = (data ?? []) as RawRow[];

    const profiles = rows.map((row) => {
      return {
        id: getStringFromRow(row, ["id"], ""),
        full_name: getStringFromRow(
          row,
          ["full_name", "name", "display_name"],
          null
        ),
        email: getStringFromRow(row, ["email", "contact_email"], null),
        _raw: row,
      };
    });

    return NextResponse.json({ ok: true, profiles });
  } catch (err) {
    console.error("GET /api/adm/profiles error", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
