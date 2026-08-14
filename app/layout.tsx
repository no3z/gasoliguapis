import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import AnalyticsConsent from "./analytics";
import { ADSENSE_ACCOUNT, SITE_NAME, SITE_URL } from "./site-config";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: "Gasolineras con GLP, AdBlue, baños y café | Gasoliguapis",
    template: "%s | Gasoliguapis",
  },
  description: "Compara precios oficiales y encuentra gasolineras con GLP, AdBlue, baños cuidados y buen café en las carreteras de España.",
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
    title: "Gasoliguapis — Decide dónde merece la pena parar",
    description: "Precios oficiales, GLP, AdBlue, baños y café en las carreteras de España.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Gasoliguapis, tu mejor parada en carretera" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gasoliguapis — Decide dónde merece la pena parar",
    description: "Precios oficiales, GLP, AdBlue, baños y café en carretera.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-ES"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}<AnalyticsConsent /></body></html>;
}
