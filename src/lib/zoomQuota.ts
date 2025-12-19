// src/lib/zoomQuota.ts
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Ambil jumlah sesi Zoom per bulan berdasarkan plan.
 * Asumsi: ada tabel `plans` dengan kolom `zoom_sessions_per_month`.
 * Kalau belum ada, sementara akan fallback ke 8.
 */
export async function getMeetingsPerMonthForPlan(
  supabase: SupabaseClient,
  planId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("plans")
    .select("zoom_sessions_per_month")
    .eq("id", planId)
    .maybeSingle();

  if (error) {
    console.warn("getMeetingsPerMonthForPlan error, fallback 8", error);
    return 8;
  }

  if (!data || data.zoom_sessions_per_month == null) {
    return 8; // default paket 8 pertemuan
  }

  return data.zoom_sessions_per_month as number;
}

/**
 * Generate / reset kuota Zoom untuk 1 user + 1 subscription
 * di semua kelas yang sedang diikuti user tersebut.
 *
 * - class diambil dari tabel `class_students`
 * - kuota disimpan di `class_student_zoom_quota`
 */
export async function syncZoomQuotaForUserSubscription(
  supabase: SupabaseClient,
  options: {
    subscriptionId: string;
    userId: string;
    meetingsPerMonth: number;
    startAt: string;
    endAt: string;
  }
) {
  const { subscriptionId, userId, meetingsPerMonth, startAt, endAt } = options;

  // 1️⃣ ambil semua kelas yang diikuti murid ini
  const { data: classLinks, error: clsErr } = await supabase
    .from("class_students")
    .select("class_id")
    .eq("student_id", userId);

  if (clsErr) {
    console.error("syncZoomQuota: fetch class_students error", clsErr);
    throw clsErr;
  }

  if (!classLinks || classLinks.length === 0) {
    // belum ikut kelas apa-apa → tidak apa-apa, tidak usah bikin kuota
    return;
  }

  // 2️⃣ siapkan rows untuk upsert
  const rows = classLinks.map((row) => ({
    class_id: row.class_id,
    student_id: userId,
    subscription_id: subscriptionId,
    period_start: startAt,
    period_end: endAt,
    allowed_sessions: meetingsPerMonth,
    used_sessions: 0,
  }));

  // 3️⃣ upsert ke `class_student_zoom_quota`
  const { error: upsertErr } = await supabase
    .from("class_student_zoom_quota")
    .upsert(rows, {
      // ⚠️ Pastikan di DB ada UNIQUE (class_id, student_id, subscription_id)
      onConflict: "class_id,student_id,subscription_id",
    });

  if (upsertErr) {
    console.error("syncZoomQuota: upsert quota error", upsertErr);
    throw upsertErr;
  }
}
