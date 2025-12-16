// src/app/api/adm/subscriptions/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type RawRow = Record<string, unknown>;

function getStringFromRow(
  row: RawRow | null | undefined,
  keys: string[],
  fallback = ""
): string {
  if (!row || typeof row !== "object") return fallback;
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim() !== "") return v;
    if (typeof v === "number") return String(v);
  }
  return fallback;
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // auth check (optional — keep so only logged-in users can call)
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user ?? null;
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    // Ambil subscriptions dengan relasi; ambil semua kolom relasi (*) untuk toleransi skema
    const { data, error } = await supabase
      .from("subscriptions")
      .select(
        `
        id,
        user_id,
        plan_id,
        status,
        start_at,
        end_at,
        created_at,
        profiles:profiles!user_id (*),
        plan:subscription_plans!plan_id (*)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("fetch subscriptions error", error);
      return NextResponse.json(
        { ok: false, error: "Failed to fetch subscriptions" },
        { status: 500 }
      );
    }

    const rows = (data ?? []) as RawRow[];

    const formatted = rows.map((row) => {
      const rawProfiles = row["profiles"] ?? null;
      const profileObj =
        Array.isArray(rawProfiles) && rawProfiles.length > 0
          ? (rawProfiles[0] as RawRow)
          : (rawProfiles as RawRow | null);

      const rawPlan = row["plan"] ?? null;
      const planObj =
        Array.isArray(rawPlan) && rawPlan.length > 0
          ? (rawPlan[0] as RawRow)
          : (rawPlan as RawRow | null);

      const studentName = getStringFromRow(
        profileObj,
        ["full_name", "name", "display_name"],
        ""
      );
      const email = getStringFromRow(
        profileObj,
        ["email", "contact_email"],
        ""
      );
      const planName = getStringFromRow(planObj, ["name", "title"], "");
      const zoomSessions =
        planObj && typeof planObj["zoom_sessions_per_month"] === "number"
          ? (planObj["zoom_sessions_per_month"] as number)
          : typeof planObj?.["zoom_sessions_per_month"] === "string"
          ? Number(planObj?.["zoom_sessions_per_month"])
          : null;

      const startRaw = row["start_at"];
      const endRaw = row["end_at"];
      const start =
        typeof startRaw === "string"
          ? new Date(startRaw).toLocaleDateString("id-ID")
          : "-";
      const end =
        typeof endRaw === "string"
          ? new Date(endRaw).toLocaleDateString("id-ID")
          : "-";

      return {
        id: String(row["id"] ?? ""),
        student_id: String(row["user_id"] ?? ""),
        student_name: studentName || String(row["user_id"] ?? ""),
        email: email || null,
        plan_name: planName || String(row["plan_id"] ?? ""),
        zoom_sessions: typeof zoomSessions === "number" ? zoomSessions : null,
        status: String(row["status"] ?? ""),
        period: `${start} → ${end}`,
        created_at: String(row["created_at"] ?? ""),
      };
    });

    return NextResponse.json({ ok: true, subscriptions: formatted });
  } catch (err) {
    console.error("GET /api/adm/subscriptions error", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
