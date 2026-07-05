import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
  CURATED_COMPARES,
  canonicalCompareSlug,
  getPhone,
  parseCompareSlug,
  type PhoneWithMetrics,
} from "@/lib/phones";
import {
  formatDday,
  formatManwon,
  formatMonthsAsYears,
  formatPct,
  formatYearMonth,
} from "@/lib/format";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import Badge from "@/components/ui/Badge";
import CompareResaleChart from "@/components/charts/CompareResaleChart";
import PhoneMedia from "@/components/phone/PhoneMedia";
import JsonLd from "@/components/seo/JsonLd";

export const revalidate = 86400;
// 정규 slug 외의 유효 조합(역순 포함)도 동적으로 처리해 301 리다이렉트
export const dynamicParams = true;

export function generateStaticParams() {
  return CURATED_COMPARES.map(([a, b]) => ({
    slug: canonicalCompareSlug(a, b),
  }));
}

function resolvePair(slug: string): {
  a: PhoneWithMetrics;
  b: PhoneWithMetrics;
  canonical: string;
} | null {
  const parsed = parseCompareSlug(slug);
  if (!parsed) return null;
  const [x, y] = parsed;
  const px = getPhone(x);
  const py = getPhone(y);
  if (!px || !py || x === y) return null;
  const canonical = canonicalCompareSlug(x, y);
  const [first, second] = canonical.split("-vs-");
  const a = getPhone(first)!;
  const b = getPhone(second)!;
  return { a, b, canonical };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pair = resolvePair(slug);
  if (!pair) return {};
  return {
    title: `${pair.a.name} vs ${pair.b.name} — 지원종료·수리비·잔존가치 비교`,
    description: `${pair.a.name}(잔존가치 ${formatPct(pair.a.metrics.residualPct, 0)})와 ${pair.b.name}(잔존가치 ${formatPct(pair.b.metrics.residualPct, 0)})를 보안지원 기간·수리비·중고 시세로 비교합니다.`,
    alternates: { canonical: `/compare/${pair.canonical}` },
  };
}

type Row = {
  label: string;
  a: string;
  b: string;
  /** 1 = a 우세, -1 = b 우세, 0 = 무승부/판정 없음 */
  winner: -1 | 0 | 1;
};

function buildRows(a: PhoneWithMetrics, b: PhoneWithMetrics): Row[] {
  const cmp = (
    va: number | null,
    vb: number | null,
    higherWins: boolean,
  ): -1 | 0 | 1 => {
    if (va === null || vb === null || va === vb) return 0;
    const aWins = higherWins ? va > vb : va < vb;
    return aWins ? 1 : -1;
  };

  return [
    {
      label: "출시가",
      a: formatManwon(a.releasePriceKRW),
      b: formatManwon(b.releasePriceKRW),
      winner: 0,
    },
    {
      label: "현 중고 시세 (A급)",
      a: formatManwon(a.metrics.latestResale),
      b: formatManwon(b.metrics.latestResale),
      winner: 0,
    },
    {
      label: "잔존가치",
      a: formatPct(a.metrics.residualPct, 0),
      b: formatPct(b.metrics.residualPct, 0),
      winner: cmp(a.metrics.residualPct, b.metrics.residualPct, true),
    },
    {
      label: "보안지원 종료",
      a: a.eol.securityEndDate
        ? `${formatYearMonth(a.eol.securityEndDate)} (${formatDday(a.eol.securityEndDate)})${a.eol.estimated ? " 추정" : ""}`
        : "미상",
      b: b.eol.securityEndDate
        ? `${formatYearMonth(b.eol.securityEndDate)} (${formatDday(b.eol.securityEndDate)})${b.eol.estimated ? " 추정" : ""}`
        : "미상",
      winner: cmp(
        a.metrics.monthsLeftSecurity,
        b.metrics.monthsLeftSecurity,
        true,
      ),
    },
    {
      label: "남은 보안지원",
      a:
        a.metrics.monthsLeftSecurity !== null
          ? formatMonthsAsYears(Math.max(0, a.metrics.monthsLeftSecurity))
          : "미상",
      b:
        b.metrics.monthsLeftSecurity !== null
          ? formatMonthsAsYears(Math.max(0, b.metrics.monthsLeftSecurity))
          : "미상",
      winner: cmp(
        a.metrics.monthsLeftSecurity,
        b.metrics.monthsLeftSecurity,
        true,
      ),
    },
    {
      label: "화면 수리비",
      a:
        a.metrics.displayRepairKRW !== null
          ? formatManwon(a.metrics.displayRepairKRW)
          : "—",
      b:
        b.metrics.displayRepairKRW !== null
          ? formatManwon(b.metrics.displayRepairKRW)
          : "—",
      winner: cmp(
        a.metrics.displayRepairKRW,
        b.metrics.displayRepairKRW,
        false,
      ),
    },
    {
      label: "수리비 부담률",
      a:
        a.metrics.repairBurdenPct !== null
          ? formatPct(a.metrics.repairBurdenPct, 0)
          : "—",
      b:
        b.metrics.repairBurdenPct !== null
          ? formatPct(b.metrics.repairBurdenPct, 0)
          : "—",
      winner: cmp(a.metrics.repairBurdenPct, b.metrics.repairBurdenPct, false),
    },
    {
      label: "알려진 이슈 (중대)",
      a: `${a.issues.length}건 (${a.issues.filter((i) => i.severity === "critical").length})`,
      b: `${b.issues.length}건 (${b.issues.filter((i) => i.severity === "critical").length})`,
      winner: 0,
    },
  ];
}

function WinnerCell({ value, isWinner }: { value: string; isWinner: boolean }) {
  return (
    <td
      className={`tnum text-right ${isWinner ? "font-semibold text-accent" : "text-ink"}`}
    >
      {value}
      {isWinner && (
        <span className="ml-1.5 text-[10px] font-bold" aria-label="우세">
          ✓
        </span>
      )}
    </td>
  );
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pair = resolvePair(slug);
  if (!pair) notFound();
  if (slug !== pair.canonical) {
    permanentRedirect(`/compare/${pair.canonical}`);
  }

  const { a, b } = pair;
  const rows = buildRows(a, b);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "기종 비교", path: "/compare" },
          {
            name: `${a.name} vs ${b.name}`,
            path: `/compare/${pair.canonical}`,
          },
        ])}
      />

      <nav aria-label="브레드크럼" className="text-xs text-mut">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/compare" className="hover:text-accent">
              기종 비교
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-sub">
            {a.name} vs {b.name}
          </li>
        </ol>
      </nav>

      <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-[28px]">
        {a.name} vs {b.name}
      </h1>
      <p className="mt-2 text-[15px] leading-7 text-sub">
        스펙이 아니라 결정 기준으로 비교합니다 — 몇 년 더 쓰고, 고장 나면
        얼마고, 되팔면 얼마가 남는가.
      </p>

      {/* 판정 요약 */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[a, b].map((p) => (
          <Link
            key={p.slug}
            href={`/phones/${p.slug}`}
            className="group flex items-start gap-4 rounded-xl border border-hairline bg-card p-5 shadow-card transition-all hover:border-accent-strong/40"
          >
            <PhoneMedia
              slug={p.slug}
              name={p.name}
              className="h-16 w-16 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold group-hover:text-accent">{p.name}</p>
                <Badge tone={p.metrics.verdict.tone} dot>
                  {p.metrics.verdict.label}
                </Badge>
              </div>
              <p className="mt-2 text-xs leading-5 text-sub">
                {p.metrics.verdict.reasons[0]}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* 비교 표 */}
      <section aria-label="항목별 비교" className="mt-8">
        <div className="overflow-hidden rounded-xl border border-hairline bg-card shadow-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>항목</th>
                <th className="text-right">{a.name}</th>
                <th className="text-right">{b.name}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <td className="font-medium text-sub">{r.label}</td>
                  <WinnerCell value={r.a} isWinner={r.winner === 1} />
                  <WinnerCell value={r.b} isWinner={r.winner === -1} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-mut">
          ✓ = 해당 항목 우세. 가격 항목은 체급이 달라 우세 판정을 하지
          않습니다.
        </p>
      </section>

      {/* 잔존가치 추이 비교 */}
      <section aria-label="잔존가치 추이 비교" className="mt-10">
        <h2 className="text-lg font-bold tracking-tight">
          잔존가치 추이 (출시가 대비 %)
        </h2>
        {a.resale.length >= 3 && b.resale.length >= 3 ? (
          <div className="mt-4 rounded-xl border border-hairline bg-card p-4 shadow-card sm:p-5">
            <CompareResaleChart
              series={[
                {
                  name: a.name,
                  releasePriceKRW: a.releasePriceKRW,
                  points: a.resale,
                },
                {
                  name: b.name,
                  releasePriceKRW: b.releasePriceKRW,
                  points: b.resale,
                },
              ]}
            />
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-hairline bg-card p-5 text-sm leading-6 text-sub shadow-card">
            두 기종의 시세 기록이 3개월 이상 쌓이면 추이 비교 차트가 열립니다.
            현재 기록은 아래 표에서 확인하세요.
          </p>
        )}

        {/* 표 병행 — 접근성/저대비 색상 보완 채널 */}
        <div className="mt-4 overflow-hidden rounded-xl border border-hairline bg-card shadow-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>기준일</th>
                <th className="text-right">{a.name}</th>
                <th className="text-right">{b.name}</th>
              </tr>
            </thead>
            <tbody>
              {a.resale.map((point, i) => {
                const bPoint = b.resale[i];
                return (
                  <tr key={point.date}>
                    <td className="tnum">{point.date.slice(0, 7)}</td>
                    <td className="tnum text-right">
                      {formatManwon(point.priceKRW)} (
                      {formatPct((point.priceKRW / a.releasePriceKRW) * 100, 0)}
                      )
                    </td>
                    <td className="tnum text-right">
                      {bPoint
                        ? `${formatManwon(bPoint.priceKRW)} (${formatPct((bPoint.priceKRW / b.releasePriceKRW) * 100, 0)})`
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-10 flex flex-wrap gap-2">
        <Link
          href={`/phones/${a.slug}`}
          className="rounded-full border border-hairline bg-card px-4 py-2 text-sm font-medium text-sub transition-colors hover:border-accent-strong/40 hover:text-accent"
        >
          {a.name} 결정 문서 →
        </Link>
        <Link
          href={`/phones/${b.slug}`}
          className="rounded-full border border-hairline bg-card px-4 py-2 text-sm font-medium text-sub transition-colors hover:border-accent-strong/40 hover:text-accent"
        >
          {b.name} 결정 문서 →
        </Link>
      </div>
    </div>
  );
}
