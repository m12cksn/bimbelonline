# Go-Live Checklist (MathKids)

Checklist ini untuk memastikan sistem stabil, aman, dan siap dijual.

## 1) Data & Access (RLS / Policy)
- [ ] Admin dapat melihat semua data (profiles, subscriptions, quota) tanpa 403.
- [ ] Student hanya bisa melihat data miliknya sendiri.
- [ ] Insert/update attendance & quota tidak menghasilkan error RLS.
- [ ] Tidak ada infinite recursion policy di tabel `profiles`.

## 2) Billing Flow (End-to-End)
- [ ] User daftar paket → payment dibuat.
- [ ] Admin approve payment → subscription aktif.
- [ ] Quota zoom otomatis ter-generate sesuai plan.
- [ ] Attendance mengurangi quota.

## 3) Error Logging & Alerts
- [ ] Error backend dicatat (minimal console error di server).
- [ ] Notifikasi (toast) muncul untuk semua error & success penting.
- [ ] Tidak ada alert() blocking.

## 4) Content & Legal
- [ ] Privacy Policy final di `src/app/privacy/page.tsx`.
- [ ] Terms of Service final di `src/app/terms/page.tsx`.
- [ ] Contact Support final di `src/app/support/page.tsx`.

## 5) Deployment (Vercel + Supabase)
- [ ] Vercel env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Build command: `npm run build`, Output: default Next.js.
- [ ] Domain + SSL aktif (Vercel Domains).
- [ ] Redirects/headers sesuai kebutuhan (mis. `/dashboard/*` auth).
- [ ] Scope env vars benar: Preview vs Production.
- [ ] Preview deployment pakai project yang sama (branch preview).
- [ ] Pastikan build cache tidak menyimpan nilai env lama (clear cache jika perlu).
- [ ] Vercel analytics/logs aktif untuk troubleshooting awal.

## 6) Operational
- [ ] Backup DB terjadwal (Supabase daily backup + PITR jika ada).
- [ ] Monitoring uptime/latency (UptimeRobot/BetterStack).
- [ ] Error logging server (Sentry/Logflare/console + alerts).

## 7) UX Sanity Check
- [ ] Student dashboard: materi selesai vs belum selesai jelas.
- [ ] Upgrade page: paket & kuota tampil sesuai plan.
- [ ] Zoom page: absen hadir → kuota berkurang + join enabled.

## 8) Post-Deploy Verification (Vercel)
- [ ] Homepage bisa diakses tanpa error.
- [ ] Login / signup berhasil.
- [ ] Admin page bisa load data tanpa 403.
- [ ] Student quiz: submit jawaban dan nilai tampil benar.
- [ ] Zoom attendance: absen hadir mengurangi kuota.

---

## Notes
Jika ada bug kecil, prioritaskan yang berhubungan dengan pembayaran, RLS, dan data integrity.
