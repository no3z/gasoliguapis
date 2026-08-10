import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://gasoliguapis.es"),
  title: { default: "Gasoliguapis", template: "%s · Gasoliguapis" },
  description: "La guía de paradas en carretera que puntúa lo que de verdad importa.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Gasoliguapis",
    title: "Gasoliguapis — Tu mejor parada en carretera",
    description: "Café rico, baños limpios y precios actualizados. Todo en una sola parada.",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "Gasoliguapis, tu mejor parada en carretera" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gasoliguapis — Tu mejor parada en carretera",
    description: "Café rico, baños limpios y precios al día.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
