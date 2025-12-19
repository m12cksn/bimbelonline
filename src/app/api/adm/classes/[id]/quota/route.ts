import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type RawRow = Record<string, unknown>;

type QuotaRow = {
  student_id: string;
  subscription_id: string | null;
  allowed_sessions: number | null;
  used_sessions: number | null;
  period_start: string | null;
  period_end: string | null;
};

function asString(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return fallback;
}

function quotaKey(studentId: string, subscriptionId: string | null): string {
  return `${studentId}::${subscriptionId ?? "null"}`;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams =
      typeof params === "object" && "then" in params ? await params : params;
    const classId = Number(resolvedParams?.id);

    if (Number.isNaN(classId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid class id" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user ?? null;
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileErr || profile?.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { data: studentsRaw, error: studentsErr } = await supabase
      .from("class_students")
      .select(
        `
        student_id,
        start_date,
        end_date,
        profiles:profiles!student_id(full_name,email)
      `
      )
      .eq("class_id", classId);

    if (studentsErr) {
      console.error("quota rekap fetch students", studentsErr);
      return NextResponse.json(
        { ok: false, error: "Failed to fetch class students" },
        { status: 500 }
      );
    }

    const { data: quotasRaw, error: quotasErr } = await supabase
      .from("class_student_zoom_quota")
      .select(
        "student_id, subscription_id, allowed_sessions, used_sessions, period_start, period_end"
      )
      .eq("class_id", classId);

    if (quotasErr) {
      console.error("quota rekap fetch quotas", quotasErr);
      return NextResponse.json(
        { ok: false, error: "Failed to fetch quota" },
        { status: 500 }
      );
    }

    const quotas = (quotasRaw ?? []) as QuotaRow[];
    const quotaMap = new Map<string, QuotaRow>();
    const quotaByStudent = new Map<string, QuotaRow>();
    quotas.forEach((q) => {
      const sid = asString(q.student_id);
      const subId = q.subscription_id ?? null;
      quotaMap.set(quotaKey(sid, subId), q);
      if (!quotaByStudent.has(sid)) {
        quotaByStudent.set(sid, q);
      }
    });

    const rows = (studentsRaw ?? []) as RawRow[];
    const students = rows.map((row) => {
      const student_id = asString(row["student_id"]);
      // class_students tidak menyimpan subscription_id; gunakan null untuk pencarian quota
      const subscription_id: string | null = null;
      const quota =
        quotaMap.get(quotaKey(student_id, subscription_id)) ??
        quotaByStudent.get(student_id) ??
        null;

      const profile =
        row["profiles"] && typeof row["profiles"] === "object"
          ? (row["profiles"] as RawRow)
          : null;

      const allowed = quota?.allowed_sessions ?? 0;
      const used = quota?.used_sessions ?? 0;

      return {
        student_id,
        name:
          asString(profile?.["full_name"]) ||
          asString(profile?.["name"]) ||
          student_id,
        email: asString(profile?.["email"], "") || null,
        subscription_id,
        start_date:
          typeof row["start_date"] === "string" ? row["start_date"] : null,
        end_date: typeof row["end_date"] === "string" ? row["end_date"] : null,
        quota: quota
          ? {
              allowed,
              used,
              remaining: allowed - used,
              period_start:
                typeof quota.period_start === "string"
                  ? quota.period_start
                  : null,
              period_end:
                typeof quota.period_end === "string" ? quota.period_end : null,
            }
          : null,
      };
    });

    return NextResponse.json({ ok: true, class_id: classId, students });
  } catch (err) {
    console.error("GET /api/adm/classes/[id]/quota", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
