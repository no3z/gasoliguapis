import type { Metadata } from "next";
import StationExplorer from "../../station-explorer";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Buscador nacional de gasolineras con GLP",
  description: "Busca las gasolineras con GLP más baratas de España, por provincia o a menos de 75 km de tu ubicación.",
  alternates: { canonical: "/gasolineras-con-glp" },
  robots: { index: false, follow: true },
};

export default function GlpSearchPage() {
  return <StationExplorer initialFuel="lpg" signInPath="/signin-with-chatgpt?return_to=%2Fbuscar%2Fglp" />;
}
