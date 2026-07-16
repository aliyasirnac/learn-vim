import type { Metadata } from "next";
import { VT323, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const display = VT323({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
});

const mono = IBM_Plex_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-mono-game",
});

export const metadata: Metadata = {
  title: "Vim Ustası — Oyunla Vim Öğren",
  description:
    "A'dan Z'ye, tamamen ücretsiz ve oyunlaştırılmış Vim eğitimi: hareketler, operatörler, text object'ler, makrolar, registerlar ve çoklu dosya iş akışı.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={cn("h-full antialiased dark", display.variable, mono.variable)}>
      <body className="min-h-full flex flex-col crt-body">{children}</body>
    </html>
  );
}
