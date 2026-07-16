import type { Metadata } from "next";
import { VT323, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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
  metadataBase: new URL(siteUrl),
  title: {
    default: "Vim Ustası — Oyunla Vim Öğren",
    template: "%s | Vim Ustası",
  },
  description:
    "A'dan Z'ye, tamamen ücretsiz ve oyunlaştırılmış Vim eğitimi: hareketler, operatörler, text object'ler, makrolar, registerlar ve çoklu dosya iş akışı.",
  applicationName: "Vim Ustası",
  keywords: ["Vim öğren", "Vim eğitimi", "Vim tutorial", "Vim komutları", "Türkçe Vim"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "/",
    siteName: "Vim Ustası",
    title: "Vim Ustası — Oyunla Vim Öğren",
    description: "Tarayıcıda çalışan gerçek Vim motoruyla, oyunlaştırılmış ve ücretsiz Türkçe Vim eğitimi.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Vim Ustası — Oyunla Vim Öğren" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vim Ustası — Oyunla Vim Öğren",
    description: "Tarayıcıda çalışan gerçek Vim motoruyla ücretsiz Türkçe Vim eğitimi.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={cn("h-full antialiased dark", display.variable, mono.variable)}>
      <body className="min-h-full flex flex-col crt-body">
        {children}
        <footer className="border-t border-(--vim-border) bg-(--vim-bg-raise) px-4 py-5 text-center text-sm text-(--vim-text-dim)">
        <p>
          <span>Vim Ustası, </span>
          <a
            href="https://aliyasirnac.com"
            target="_blank"
            rel="noopener"
            className="text-(--vim-green) underline-offset-4 hover:underline"
          >
            Ali Yasir Nac&apos;ın projeleri
          </a>
          <span> arasında.</span>
        </p>
        <nav aria-label="Harici bağlantılar" className="mt-2 flex justify-center gap-4">
          <a
            href="https://aliyasirnac.com"
            target="_blank"
            rel="noopener"
            className="hover:text-(--vim-green-bright) hover:underline"
          >
            aliyasirnac.com
          </a>
          <a
            href="https://github.com/aliyasirnac/learn-vim"
            target="_blank"
            rel="noopener"
            className="hover:text-(--vim-green-bright) hover:underline"
          >
            GitHub kaynak kodu
          </a>
        </nav>
        </footer>
      </body>
    </html>
  );
}
