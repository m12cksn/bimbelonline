import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getDiagnosticQuestionsFromDb } from "@/lib/diagnosticQuestionStore";

function serviceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function capitalizeWords(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word)
    .join(" ");
}

function normalizeWhatsapp(value: string) {
  const digits = value.replace(/[^0-9]/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    studentName?: string;
    parentWhatsapp?: string;
    gradeLevel?: number;
    concern?: string;
  };

  const studentName = capitalizeWords(String(body.studentName ?? ""));
  const parentWhatsapp = normalizeWhatsapp(String(body.parentWhatsapp ?? ""));
  const gradeLevel = Number(body.gradeLevel);
  const concern = String(body.concern ?? "").trim() || null;

  if (!studentName || !parentWhatsapp || !Number.isInteger(gradeLevel) || gradeLevel < 1 || gradeLevel > 12) {
    return NextResponse.json(
      { ok: false, error: "Nama anak, kelas, dan WhatsApp wajib diisi dengan benar." },
      { status: 400 },
    );
  }

  const supabase = serviceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Konfigurasi Supabase belum lengkap." }, { status: 500 });
  }

  const questionIds = (await getDiagnosticQuestionsFromDb(gradeLevel)).map((question) => question.id);
  const { data, error } = await supabase
    .from("diagnostic_attempts")
    .insert({
      student_name: studentName,
      parent_whatsapp: parentWhatsapp,
      grade_level: gradeLevel,
      concern,
      question_ids: questionIds,
      status: "in_progress",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("diagnostic start error", error);
    return NextResponse.json(
      { ok: false, error: "Gagal membuat cek kemampuan. Pastikan migrasi database sudah dijalankan." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, attemptId: data.id });
}
