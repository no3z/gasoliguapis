import type { Metadata } from "next";
import StationExplorer from "../../station-explorer";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Buscador nacional de gasolineras con AdBlue",
  description: "Busca gasolineras con precio oficial de AdBlue en toda España, por provincia o cerca de tu ubicación.",
  alternates: { canonical: "/gasolineras-con-adblue" },
  robots: { index: false, follow: true },
};

export default function AdblueSearchPage() {
  return <StationExplorer initialFuel="adblue" signInPath="/signin-with-chatgpt?return_to=%2Fbuscar%2Fadblue" />;
}
