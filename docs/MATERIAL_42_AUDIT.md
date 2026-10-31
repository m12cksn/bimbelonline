# Audit paket materi 42

31 Oktober 2026. Pembacaan langsung 40 prompt, opsi pilihan ganda, pasangan mencocokkan, dan bagian multipart dari Supabase; tidak ada perubahan database. Tingkat kesulitan adalah penilaian pedagogis sementara, bukan pengukuran dari data siswa.

Paket 24 soal terdiri dari 24 soal non-pengurangan pada nomor 1–28. Empat pengurangan, enam mencocokkan dan enam multipart tetap disimpan sebagai 16 cadangan. Variasi akhir (pasangan 10 dan tiga suku) tetap terwakili. Paket memakai 14 isian dan 10 pilihan ganda. Tidak mengubah kunci jawaban atau isi bank. Nomor 7 memiliki kalimat cerita yang perlu peninjauan editorial; penilaian tetap di server.

| Nomor asli | Kemampuan | Kesulitan sementara | Status |
|---|---|---|---|
| 1 | Penjumlahan dua kelompok | Dasar | Paket urutan 1 |
| 2 | Urutan bilangan | Dasar | Paket urutan 5 |
| 3 | Penjumlahan dua kelompok | Berkembang | Paket urutan 9 |
| 4 | Pengurangan 9 − 5 | Berkembang | Cadangan |
| 5 | Penjumlahan dua kelompok | Dasar | Paket urutan 2 |
| 6 | Pasangan menuju 10 | Menantang | Paket urutan 20 |
| 7 | Cerita dan menghitung lanjut | Menantang | Paket urutan 18 |
| 8 | Penjumlahan dua kelompok | Dasar | Paket urutan 3 |
| 9 | Penjumlahan dua kelompok | Berkembang | Paket urutan 8 |
| 10 | Penjumlahan dua kelompok | Berkembang | Paket urutan 14 |
| 11 | Pengurangan 10 − 1 | Berkembang | Cadangan |
| 12 | Penjumlahan dengan nol | Dasar | Paket urutan 7 |
| 13 | Tiga suku | Menantang | Paket urutan 24 |
| 14 | Cerita dan menghitung lanjut | Menantang | Paket urutan 17 |
| 15 | Cerita dan menghitung lanjut | Menantang | Paket urutan 19 |
| 16 | Penjumlahan dua kelompok | Berkembang | Paket urutan 13 |
| 17 | Pasangan menuju 10 | Menantang | Paket urutan 23 |
| 18 | Penjumlahan dua kelompok | Berkembang | Paket urutan 10 |
| 19 | Urutan bilangan | Dasar | Paket urutan 4 |
| 20 | Perbandingan kuantitas | Berkembang | Paket urutan 15 |
| 21 | Pengurangan 9 − 4 | Berkembang | Cadangan |
| 22 | Pasangan menuju 10 | Menantang | Paket urutan 21 |
| 23 | Penjumlahan dua kelompok | Dasar | Paket urutan 6 |
| 24 | Urutan bilangan | Berkembang | Paket urutan 16 |
| 25 | Penjumlahan dua kelompok | Berkembang | Paket urutan 12 |
| 26 | Pengurangan 10 − 7 | Berkembang | Cadangan |
| 27 | Pasangan menuju 10 | Menantang | Paket urutan 22 |
| 28 | Penjumlahan dua kelompok | Berkembang | Paket urutan 11 |
| 29 | Kuantitas stroberi 1–4 → bilangan | Dasar | Cadangan |
| 30 | Bilangan 1–4 → nama bilangan | Dasar | Cadangan |
| 31 | Penjumlahan 2+3, 4+1, 5+0, 3+3 | Berkembang | Cadangan |
| 32 | Kuantitas bola 1–4 → bilangan | Dasar | Cadangan |
| 33 | Pasangan menuju 10: 1+9 sampai 4+6 | Menantang | Cadangan |
| 34 | Penjumlahan 6+2, 7+1, 8+1, 5+4 | Berkembang | Cadangan |
| 35 | Gambar 2+1; 8−3; urutan 6–9 | Menantang | Cadangan |
| 36 | 2+5; 9−2; pasangan 10 untuk 4 | Menantang | Cadangan |
| 37 | 3+3; 10−4; urutan 1–5 | Menantang | Cadangan |
| 38 | 4+1; 7+2; pasangan 10 untuk 9 | Menantang | Cadangan |
| 39 | Gambar 3+1; 6−1; urutan mundur 10–7 | Menantang | Cadangan |
| 40 | 5+2; 8−5; pasangan 10 untuk 8 | Menantang | Cadangan |

UI: kotak video dan tombol mulai disembunyikan ketika latihan aktif; ruang soal diringkas dengan CSS responsif. Belum ada bukti bahwa seluruh 24 soal muat satu layar pada semua viewport. Jangan menutupi overflow: teks panjang dan keyboard dapat memerlukan scroll. TypeScript dan 299 tes (18 suite) lulus. Build produksi final lulus (87 halaman), dengan URL/key Supabase placeholder; bukan verifikasi koneksi produksi. Lint komponen MissingAddend dan helper kurasi lulus. Browser lokal menavigasi seluruh 24 soal pada iframe viewport ponsel 358×738 dan tablet 766×1022; desktop 1363×936 diperiksa pada soal pertama. Pengujian memakai fixture prompt/opsi, endpoint penilaian tiruan, tanpa akses tulis database. Ini bukan verifikasi penilaian/progres/login produksi. Ukuran viewport iframe tidak mengemulasikan Safari atau keyboard ponsel. Soal 21 sempat melewati tinggi layar; label berulang dipangkas setelah temuan itu dan perlu pengukuran ulang; percobaan ulang browser ditolak kebijakan akses frame, sehingga hasil terakhir tidak diklaim terverifikasi. Soal 19 sebelum menjawab mencapai 716 dari 738 px. Umpan balik jawaban salah yang panjang boleh menggulir agar isi tetap dapat dibaca.

Catatan bank: nomor 31 memiliki tiga hasil 5 dan nomor 34 memiliki hasil 8/9 berulang. Periksa aturan pasangan sebelum mengaktifkan paket mencocokkan. Kemampuan kuantitas, urutan, dan pasangan 10 dari nomor akhir sudah diwakili dalam paket 24; format mencocokkan/multipart sengaja disimpan, sesuai pilihan tanpa drag-and-drop.

Urutan nomor asli paket: 1, 5, 8, 19, 2, 23, 12, 9, 3, 18, 28, 25, 16, 10, 20, 24, 14, 7, 15, 6, 22, 27, 17, 13. Prefetch menggunakan minimum/maksimum nomor dalam jendela, bukan nomor pertama/terakhir yang tidak lagi monoton. Admin tetap dapat membuka semua 40 soal. Website mandiri masih menyebut 15 soal; sinkronkan menjadi 24 bersamaan dengan rilis utama, bukan lebih awal.
