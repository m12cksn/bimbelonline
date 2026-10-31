# Ruang latihan kelas 1

31 Oktober 2026. Melanjutkan layout materi 42 dari main 003d7c2.

## Cakupan

- Semua latihan biasa yang menerima `childFriendly={material.grade_id === 1}` memakai ruang latihan ringkas, progres, teks jawaban besar, dan tautan keluar ke materi masing-masing.
- Satu soal per halaman tetap berlaku. Preview semua soal admin tetap memakai layout daftar.
- Kurasi 24 soal tetap khusus materi 42; materi lain mempertahankan katalog/urutan/batas akses yang sudah ada. Tidak ada mutasi database, perubahan kunci atau penilaian.
- Soal majemuk, mencocokkan, dan gambar soal memakai lebar penuh. Visual puluhan/satuan dan perbandingan memiliki penyesuaian layout tersendiri. Caption berulang disembunyikan, petunjuk utama tetap tersedia.
- Fokus keyboard dan reduced motion dipertahankan. Tidak mengunci overflow atau menyembunyikan soal panjang untuk memaksakan satu layar.

## Verifikasi

- TypeScript lulus.
- 18 suite / 299 tes lulus.
- Build produksi final lulus (87 halaman). Konfigurasi build memakai placeholder Supabase, bukan pengujian koneksi produksi.
- Belum ada pengujian browser baru pada perubahan lintas materi ini. Bukti browser sebelumnya hanya untuk materi 42 dan tidak membuktikan seluruh materi kelas 1.
- Tinggi layar, keyboard virtual, zoom, soal majemuk, dan gambar panjang masih perlu pemeriksaan visual. Jangan mengklaim semua soal muat satu layar di seluruh perangkat.
