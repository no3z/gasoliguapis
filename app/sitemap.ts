import type { MetadataRoute } from "next";
import { getIndexableRoutes, SEO_LAST_MODIFIED_AT } from "./seo-routes";
import { SITE_URL } from "./site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  return getIndexableRoutes().map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: new Date(SEO_LAST_MODIFIED_AT),
    changeFrequency: route.frequency,
    priority: route.priority,
  }));
}
