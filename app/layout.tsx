import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import GooglePrivacyMeasurement from "./analytics";
import { ADSENSE_ACCOUNT, SITE_NAME, SITE_URL } from "./site-config";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: "Buscador de gasolineras GLP y AdBlue | Gasoliguapis",
    template: "%s | Gasoliguapis",
  },
  description: "Encuentra gasolineras con GLP y AdBlue, compara precios oficiales y consulta puntuaciones reales de la parada y sus servicios.",
  referrer: "strict-origin-when-cross-origin",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  manifest: "/manifest.webmanifest",
  other: { "google-adsense-account": ADSENSE_ACCOUNT },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "/",
    siteName: SITE_NAME,
    title: "Gasoliguapis — Buscador de gasolineras GLP y AdBlue",
    description: "Precios oficiales y puntuaciones de gasolineras, baños, café y limpieza.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Gasoliguapis, buscador de gasolineras GLP y AdBlue con puntuaciones" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gasoliguapis — Buscador de gasolineras GLP y AdBlue",
    description: "Precios oficiales y puntuaciones de gasolineras y servicios.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-ES"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}<GooglePrivacyMeasurement /></body></html>;
}
