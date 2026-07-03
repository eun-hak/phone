import type { MetadataRoute } from "next";
import {
  CURATED_COMPARES,
  canonicalCompareSlug,
  getAllPhones,
} from "@/lib/phones";
import { DOC_TYPES } from "@/lib/site";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const phones = getAllPhones();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/phones",
    "/calendar",
    "/repair-cost",
    "/compare",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.8,
  }));

  const phoneRoutes: MetadataRoute.Sitemap = phones.flatMap((p) => [
    {
      url: `${SITE_URL}/phones/${p.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    ...DOC_TYPES.map((d) => ({
      url: `${SITE_URL}/phones/${p.slug}/${d.key}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    {
      url: `${SITE_URL}/phones/${p.slug}/used-check`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
  ]);

  const compareRoutes: MetadataRoute.Sitemap = CURATED_COMPARES.map(
    ([a, b]) => ({
      url: `${SITE_URL}/compare/${canonicalCompareSlug(a, b)}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    }),
  );

  return [...staticRoutes, ...phoneRoutes, ...compareRoutes];
}
