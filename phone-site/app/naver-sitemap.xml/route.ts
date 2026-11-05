import sitemap from "@/app/sitemap";


/**
 * 네이버 서치어드바이저에 제출해 둔 주소. 검색엔진별 색인 분리를 해제한 뒤로는
 * sitemap.xml 과 내용이 같다. 이미 제출된 URL 이라 404 가 나지 않도록 유지한다.
 */
export const dynamic = "force-static";

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function GET() {
  const base = sitemap();
  const now = new Date();
  const urls = base
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
