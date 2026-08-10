import type { Metadata } from "next";
import StationExplorer from "./station-explorer";

export const metadata: Metadata = {
  title: "Gasoliguapis — Tu mejor parada en carretera",
  description:
    "Encuentra gasolineras con buen café, baños limpios y precios actualizados en las carreteras de España.",
};

export default function Home() {
  return <StationExplorer />;
}
