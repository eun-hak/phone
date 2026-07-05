import type { MetadataRoute } from "next";
import {
  CURATED_COMPARES,
  canonicalCompareSlug,
  getAllPhones,
} from "@/lib/phones";
import { RANKINGS } from "@/lib/rankings";
import { SERIES_LIST } from "@/lib/series";
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
    "/best",
    "/finder",
    "/price-check",
    "/issues",
    "/series",
    "/my",
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

  const rankingRoutes: MetadataRoute.Sitemap = RANKINGS.map((r) => ({
    url: `${SITE_URL}/best/${r.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const seriesRoutes: MetadataRoute.Sitemap = SERIES_LIST.map((s) => ({
    url: `${SITE_URL}/series/${s.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    ...staticRoutes,
    ...phoneRoutes,
    ...compareRoutes,
    ...rankingRoutes,
    ...seriesRoutes,
  ];
}
