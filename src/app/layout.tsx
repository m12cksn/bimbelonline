import type { Metadata } from "next";
import { Nunito, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import { ToastProvider } from "@/app/components/ToastProvider";
import RouteLoader from "@/app/components/RouteLoader";

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
    default: "BeSmartKids - Bimbel Matematika dan Coding Interaktif",
    template: "%s | BeSmartKids",
  },
  description:
    "BeSmartKids adalah bimbel matematika dan Coding interaktif dengan latihan adaptif, evaluasi hasil, dan kelas Zoom untuk siswa SD.",
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
    title: "BeSmartKids - Bimbel Matematika dan Coding Interaktif",
    description:
      "Latihan matematika, dan coding interaktif rangkuman hasil, dan kelas Zoom untuk siswa SD dan SMP.",
  },
  twitter: {
    card: "summary",
    title: "BeSmartKids - Bimbel Matematika dan Coding Interaktif",
    description:
      "Latihan matematika, dan coding interaktif rangkuman hasil, dan kelas Zoom untuk siswa SD dan SMP",
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
  },
};

const fbPixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        {fbPixelId ? (
          <Script id="fb-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod? n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${fbPixelId}');fbq('track','PageView');`}
          </Script>
        ) : null}
      </head>
      <body
        className={`${nunito.className} ${nunito.variable} ${geistMono.variable} antialiased`}
      >
        {fbPixelId ? (
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${fbPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        ) : null}
        <Suspense fallback={null}>
          <RouteLoader />
        </Suspense>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
