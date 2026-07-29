/** OG 이미지 URL 빌더 — /api/og 에 파라미터를 붙여 상대경로 반환.
 *  metadataBase(SITE_URL)에 의해 절대 URL로 해석된다. */
export function ogImage(params: {
  title: string;
  kicker?: string;
  subtitle?: string;
  stats?: [string, string][];
}): string {
  const sp = new URLSearchParams();
  sp.set("title", params.title);
  if (params.kicker) sp.set("kicker", params.kicker);
  if (params.subtitle) sp.set("subtitle", params.subtitle);
  (params.stats ?? []).slice(0, 3).forEach(([label, value], i) => {
    sp.set(`s${i + 1}`, `${label}|${value}`);
  });
  return `/api/og?${sp.toString()}`;
}

/** Next Metadata 의 openGraph.images / twitter.images 에 넣을 형태 */
export function ogImageMeta(params: Parameters<typeof ogImage>[0]) {
  return [{ url: ogImage(params), width: 1200, height: 630 }];
}
