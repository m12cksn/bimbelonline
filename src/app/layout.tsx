import type { Metadata } from "next";
import { Nunito, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/app/components/ToastProvider";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://besmartkids.id"),
  applicationName: "BeSmartKids",
  title: {
    default: "BeSmartKids - Bimbel Matematika Interaktif",
    template: "%s | BeSmartKids",
  },
  description:
    "BeSmartKids adalah bimbel matematika interaktif dengan latihan adaptif, evaluasi hasil, dan kelas Zoom untuk siswa SD.",
  keywords: [
    "bimbel matematika",
    "les matematika",
    "belajar matematika SD",
    "bimbel coding anak",
    "kelas coding online",
    "coding untuk anak SD",
    "belajar coding scratch",
    "latihan soal matematika",
    "kelas zoom",
    "Smartkids",
  ],
  authors: [{ name: "BeSmartKids" }],
  creator: "BeSmartKids",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "BeSmartKids",
    title: "BeSmartKids - Bimbel Matematika Interaktif",
    description:
      "Latihan matematika interaktif, rangkuman hasil, dan kelas Zoom untuk siswa SD.",
  },
  twitter: {
    card: "summary",
    title: "BeSmartKids - Bimbel Matematika Interaktif",
    description:
      "Latihan matematika interaktif, rangkuman hasil, dan kelas Zoom untuk siswa SD.",
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${nunito.className} ${nunito.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
