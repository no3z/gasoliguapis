import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gasoliguapis · Paradas que merecen la pena",
    short_name: "Gasoliguapis",
    description: "Precios oficiales, GLP, AdBlue y servicios en carretera.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f3eb",
    theme_color: "#162a2c",
    lang: "es-ES",
    categories: ["travel", "navigation", "utilities"],
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
    shortcuts: [
      { name: "Buscar GLP", short_name: "GLP", url: "/gasolineras-con-glp" },
      { name: "Buscar AdBlue", short_name: "AdBlue", url: "/gasolineras-con-adblue" },
      { name: "Calcular ahorro", short_name: "Ahorro", url: "/calculadora-ahorro-combustible" },
    ],
  };
}
