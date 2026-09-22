import sitemap from "@/app/sitemap";
import { getAllPhones } from "@/lib/phones";
import { NAVER_EXTRA_DOC_KEYS, SITE_URL } from "@/lib/site";

/**
 * 네이버 서치어드바이저 제출용 사이트맵.
 * 구글용 sitemap.xml 전체 + 구글에만 noindex 한 기종 문서(tco·care·sell·resale·used-check).
 * robots.txt 에는 올리지 않는다 — 구글이 읽으면 'noindex URL 제출' 경고가 생기므로
 * 네이버 서치어드바이저에서만 직접 제출한다.
 */
export const dynamic = "force-static";

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function GET() {
  const base = sitemap();
  const now = new Date();
  const extra = getAllPhones().flatMap((p) =>
    [...NAVER_EXTRA_DOC_KEYS, "used-check"].map((key) => ({
      url: `${SITE_URL}/phones/${p.slug}/${key}`,
      lastModified: now,
    })),
  );

  const urls = [...base, ...extra]
    .map((e) => {
      const lastmod =
        e.lastModified instanceof Date
          ? e.lastModified.toISOString()
          : e.lastModified
            ? new Date(e.lastModified).toISOString()
            : null;
      return `  <url><loc>${escapeXml(e.url)}</loc>${
        lastmod ? `<lastmod>${lastmod}</lastmod>` : ""
      }</url>`;
    })
    .join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
}
