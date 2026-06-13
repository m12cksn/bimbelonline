import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: true,
      message: "Semua siswa sudah memiliki akses penuh.",
      is_premium: true,
    },
    { status: 200 },
  );
}
