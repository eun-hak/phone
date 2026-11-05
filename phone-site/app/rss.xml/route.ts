import { getLiveGuides } from "@/lib/guides";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * 리포트·가이드 RSS 피드.
 * 기종 문서는 템플릿 기반이라 제외하고, 편집 콘텐츠만 싣는다.
 */
export const dynamic = "force-static";
export const revalidate = 86400;

const escapeXml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

/** RFC-822 (RSS 날짜 형식) */
const rfc822 = (isoDate: string) => new Date(`${isoDate}T00:00:00Z`).toUTCString();

export function GET() {
  const guides = getLiveGuides()
    .slice()
    .sort((a, b) =>
      (b.publishAt ?? b.updated).localeCompare(a.publishAt ?? a.updated),
    );

  const items = guides
    .map((g) => {
      const url = `${SITE_URL}/guide/${g.slug}`;
      return [
        "    <item>",
        `      <title>${escapeXml(g.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <description>${escapeXml(g.description)}</description>`,
        `      <pubDate>${rfc822(g.publishAt ?? g.updated)}</pubDate>`,
        ...g.tags.map((t) => `      <category>${escapeXml(t)}</category>`),
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const lastBuild = guides.length
    ? rfc822(guides[0].publishAt ?? guides[0].updated)
    : new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>ko</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
