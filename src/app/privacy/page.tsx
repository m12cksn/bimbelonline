export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold">Kebijakan Privasi</h1>
        <p className="text-sm text-slate-300">
          Kami menghargai privasi Anda. Informasi yang dikumpulkan digunakan
          untuk menyediakan layanan belajar, akun, dan akses kelas.
        </p>
        <div className="space-y-2 text-sm text-slate-300">
          <p>Data yang kami simpan dapat meliputi:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Nama, email, dan informasi akun.</li>
            <li>Riwayat latihan dan hasil belajar.</li>
            <li>Riwayat kehadiran dan penggunaan kuota Zoom.</li>
          </ul>
          <p>
            Kami tidak menjual data pengguna. Akses data dibatasi untuk kebutuhan
            layanan dan administrasi.
          </p>
        </div>
        <p className="text-xs text-slate-400">
          Pertanyaan terkait privasi? Hubungi kami di halaman Support.
        </p>
      </div>
    </div>
  );
}
