import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CURATED_COMPARES, canonicalCompareSlug, getPhone } from "@/lib/phones";
import { SERIES_LIST, getSeries, phonesOfSeries } from "@/lib/series";
import {
  formatDday,
  formatManwon,
  formatPct,
  formatYearMonth,
} from "@/lib/format";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/jsonld";
import JsonLd from "@/components/seo/JsonLd";
import Badge from "@/components/ui/Badge";
import PhoneMedia from "@/components/phone/PhoneMedia";

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return SERIES_LIST.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const series = getSeries(slug);
  if (!series) return {};
  const count = phonesOfSeries(slug).length;
  return {
    title: `${series.name} 시리즈 — 세대별 지원종료·시세·판정 총정리`,
    description: `${series.name} 시리즈 ${count}개 기종의 보안지원 잔여, 중고 시세, 구매 판정을 세대순으로 비교합니다. ${series.cycleNote}.`,
    alternates: { canonical: `/series/${slug}` },
  };
}

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const series = getSeries(slug);
  if (!series) notFound();

  const phones = phonesOfSeries(slug); // 최신 출시순 (getAllPhones 정렬 유지)
  const slugsInSeries = new Set(phones.map((p) => p.slug));
  const innerCompares = CURATED_COMPARES.filter(
    ([a, b]) => slugsInSeries.has(a) && slugsInSeries.has(b),
  )
    .map(([a, b]) => {
      const pa = getPhone(a);
      const pb = getPhone(b);
      return pa && pb
        ? { slug: canonicalCompareSlug(a, b), label: `${pa.name} vs ${pb.name}` }
        : null;
    })
    .filter(Boolean) as Array<{ slug: string; label: string }>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <JsonLd
        data={[
          itemListJsonLd(
            `${series.name} 시리즈`,
            phones.map((p) => ({ name: p.name, path: `/phones/${p.slug}` })),
          ),
          breadcrumbJsonLd([
            { name: "시리즈별 보기", path: "/series" },
            { name: series.name, path: `/series/${series.slug}` },
          ]),
        ]}
      />

      <nav aria-label="브레드크럼" className="text-xs text-mut">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/series" className="hover:text-accent">
              시리즈별 보기
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-sub">{series.name}</li>
        </ol>
      </nav>

      {/* 시리즈 전환 탭 */}
      <nav aria-label="다른 시리즈" className="-mx-4 mt-4 overflow-x-auto px-4">
        <ul className="flex items-center gap-1.5 whitespace-nowrap">
          {SERIES_LIST.map((s) => {
            const active = s.slug === series.slug;
            return (
              <li key={s.slug}>
                <Link
                  href={`/series/${s.slug}`}
                  aria-current={active ? "page" : undefined}
                  className={`inline-block rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-accent bg-accent text-white"
                      : "border-hairline bg-card text-sub hover:border-accent-strong/40 hover:text-accent"
                  }`}
                >
                  {s.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{series.cycleNote}</Badge>
          <Badge tone="neutral">수록 {phones.length}개 기종</Badge>
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
          {series.name} 시리즈
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-7 text-sub">
          {series.lede}
        </p>
      </header>

      {/* 세대별 표 */}
      <section aria-label="세대별 비교 표" className="mt-8">
        <div className="overflow-x-auto rounded-xl border border-hairline bg-card shadow-card">
          <table className="data-table min-w-[720px]">
            <thead>
              <tr>
                <th>기종</th>
                <th>출시</th>
                <th className="text-right">출시가</th>
                <th className="text-right">현 시세</th>
                <th className="text-right">잔존가치</th>
                <th>보안지원</th>
                <th>판정</th>
              </tr>
            </thead>
            <tbody>
              {phones.map((p) => (
                <tr key={p.slug}>
                  <td>
                    <Link
                      href={`/phones/${p.slug}`}
                      className="flex items-center gap-2.5 font-medium hover:text-accent"
                    >
                      <PhoneMedia
                        slug={p.slug}
                        name={p.name}
                        className="h-9 w-9 shrink-0"
                      />
                      {p.name}
                    </Link>
                  </td>
                  <td className="tnum text-sub">
                    {formatYearMonth(p.releaseDate)}
                  </td>
                  <td className="tnum text-right text-sub">
                    {formatManwon(p.releasePriceKRW)}
                  </td>
                  <td className="tnum text-right font-medium">
                    {formatManwon(p.metrics.latestResale)}
                  </td>
                  <td className="tnum text-right">
                    {formatPct(p.metrics.residualPct, 0)}
                  </td>
                  <td className="tnum text-xs text-sub">
                    {p.eol.securityEndDate
                      ? `${formatYearMonth(p.eol.securityEndDate)}까지 (${formatDday(p.eol.securityEndDate)})${p.eol.estimated ? " 추정" : ""}`
                      : "미상"}
                  </td>
                  <td>
                    <Badge tone={p.metrics.verdict.tone} dot>
                      {p.metrics.verdict.label}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-5 text-mut">
          세대 합류 요령: 판정이 “추천” 이상이면서 잔존가치가 급락한 직전
          세대가 통상 가성비 스윗스팟입니다. 최신 세대는 지원 기간이 가장 길고,
          두 세대 이상 전은 남은 지원부터 확인하세요.
        </p>
      </section>

      {/* 시리즈 내 비교 */}
      {innerCompares.length > 0 && (
        <section aria-labelledby="series-compares" className="mt-10">
          <h2 id="series-compares" className="text-xl font-bold tracking-tight">
            이 시리즈에서 많이 고민하는 비교
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {innerCompares.map((c) => (
              <Link
                key={c.slug}
                href={`/compare/${c.slug}`}
                className="rounded-full border border-hairline bg-card px-4 py-2 text-sm font-medium text-sub transition-colors hover:border-accent-strong/40 hover:text-accent"
              >
                {c.label} →
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
