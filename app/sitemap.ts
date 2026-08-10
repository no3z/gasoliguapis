import type { MetadataRoute } from "next";
import { SITE_URL } from "./site-config";

const routes = [
  { path: "", priority: 1, frequency: "daily" as const },
  { path: "/gasolineras-con-glp", priority: 0.9, frequency: "weekly" as const },
  { path: "/gasolineras-con-adblue", priority: 0.9, frequency: "weekly" as const },
  { path: "/calculadora-ahorro-combustible", priority: 0.8, frequency: "monthly" as const },
  { path: "/metodologia", priority: 0.6, frequency: "monthly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: new Date("2026-08-10T00:00:00+02:00"),
    changeFrequency: route.frequency,
    priority: route.priority,
  }));
}
