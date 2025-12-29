export default function SupportPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold">Support</h1>
        <p className="text-sm text-slate-300">
          Butuh bantuan? Hubungi tim kami melalui:
        </p>
        <div className="space-y-2 text-sm text-slate-300">
          <p>Email: support@mathkids.id</p>
          <p>WhatsApp: +62 8xx-xxxx-xxxx</p>
          <p>Jam layanan: 08.00 - 20.00 WIB</p>
        </div>
        <p className="text-xs text-slate-400">
          Sertakan email akun dan deskripsi masalah agar kami bisa membantu
          lebih cepat.
        </p>
      </div>
    </div>
  );
}
