export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold">Syarat dan Ketentuan</h1>
        <p className="text-sm text-slate-300">
          Dengan menggunakan layanan ini, Anda setuju dengan syarat dan
          ketentuan berikut.
        </p>
        <div className="space-y-2 text-sm text-slate-300">
          <ul className="list-disc pl-5 space-y-1">
            <li>Akun bersifat pribadi dan tidak boleh dibagikan.</li>
            <li>Kuota Zoom mengikuti paket aktif dan periode langganan.</li>
            <li>Konten materi hanya untuk penggunaan belajar pribadi.</li>
          </ul>
          <p>
            Kami dapat memperbarui syarat layanan sewaktu-waktu untuk menjaga
            kualitas layanan.
          </p>
        </div>
        <p className="text-xs text-slate-400">
          Untuk pertanyaan, silakan hubungi tim Support.
        </p>
      </div>
    </div>
  );
}
