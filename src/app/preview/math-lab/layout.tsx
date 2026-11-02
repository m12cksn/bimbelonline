import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ruang Belajar Kelas 1 — Contoh Desain",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
