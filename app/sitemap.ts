import type { MetadataRoute } from "next";
import snapshot from "../public/data/miteco-special-fuels.json";
import { PROVINCES } from "./provinces";
import { SITE_URL } from "./site-config";

const routes = [
  { path: "", priority: 1, frequency: "daily" as const },
  { path: "/gasolineras-con-glp", priority: 0.9, frequency: "weekly" as const },
  { path: "/gasolineras-con-adblue", priority: 0.9, frequency: "weekly" as const },
  { path: "/calculadora-ahorro-combustible", priority: 0.8, frequency: "monthly" as const },
  { path: "/metodologia", priority: 0.6, frequency: "monthly" as const },
  { path: "/aviso-legal", priority: 0.2, frequency: "yearly" as const },
  { path: "/privacidad", priority: 0.2, frequency: "yearly" as const },
  { path: "/cookies", priority: 0.2, frequency: "yearly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const covered = new Set(snapshot.products.lpg.map((station) => station.province));
  const provinceRoutes = PROVINCES
    .filter((province) => covered.has(province.official))
    .map((province) => ({ path: `/gasolineras-con-glp/${province.slug}`, priority: 0.8, frequency: "daily" as const }));
  const adblueCovered = new Set(snapshot.products.adblue.map((station) => station.province));
  const adblueProvinceRoutes = PROVINCES
    .filter((province) => adblueCovered.has(province.official))
    .map((province) => ({ path: `/gasolineras-con-adblue/${province.slug}`, priority: 0.8, frequency: "daily" as const }));

  return [...routes, ...provinceRoutes, ...adblueProvinceRoutes].map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: new Date("2026-08-10T00:00:00+02:00"),
    changeFrequency: route.frequency,
    priority: route.priority,
  }));
}
