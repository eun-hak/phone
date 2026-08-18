import type { MetadataRoute } from "next";
import {
  CURATED_COMPARES,
  canonicalCompareSlug,
  getAllPhones,
} from "@/lib/phones";
import { RANKINGS } from "@/lib/rankings";
import { SERIES_LIST } from "@/lib/series";
import { GUIDES } from "@/lib/guides";
import { DOC_TYPES, NOINDEX_DOC_KEYS } from "@/lib/site";
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
    "/guide",
    "/about",
    "/methodology",
    "/privacy",
    "/contact",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.8,
  }));

  const phoneRoutes: MetadataRoute.Sitemap = phones.flatMap((p) => {
    // 중복성 높은 계산기·링크 유형(care·sell·tco·buy·used-check)은 색인 제외 —
    // 각 페이지 metadata 의 robots:{index:false} 와 일치. 사용자는 메인 페이지에서 접근.
    // 데이터가 없어 빈약한 문서(issues·repair)도 제외.
    const docKeys = DOC_TYPES.map((d) => d.key).filter((key) => {
      if (NOINDEX_DOC_KEYS.includes(key)) return false;
      if (key === "issues" && p.issues.length === 0) return false;
      if (key === "repair" && p.repairCosts.length === 0) return false;
      return true;
    });
    return [
      {
        url: `${SITE_URL}/phones/${p.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.9,
      },
      ...docKeys.map((key) => ({
        url: `${SITE_URL}/phones/${p.slug}/${key}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];
  });

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

  const guideRoutes: MetadataRoute.Sitemap = GUIDES.map((g) => ({
    url: `${SITE_URL}/guide/${g.slug}`,
    lastModified: new Date(g.updated),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [
    ...staticRoutes,
    ...phoneRoutes,
    ...compareRoutes,
    ...rankingRoutes,
    ...seriesRoutes,
    ...guideRoutes,
  ];
}
