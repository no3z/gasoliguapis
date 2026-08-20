import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gasoliguapis · Buscador de GLP y AdBlue",
    short_name: "Gasoliguapis",
    description: "Buscador de gasolineras con GLP y AdBlue, precios oficiales y puntuaciones de la comunidad.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f3eb",
    theme_color: "#162a2c",
    lang: "es-ES",
    categories: ["travel", "navigation", "utilities"],
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
    shortcuts: [
      { name: "Buscar GLP", short_name: "GLP", url: "/buscar/glp" },
      { name: "Buscar AdBlue", short_name: "AdBlue", url: "/buscar/adblue" },
      { name: "Calcular ahorro", short_name: "Ahorro", url: "/calculadora-ahorro-combustible" },
    ],
  };
}
