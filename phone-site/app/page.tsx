import Link from "next/link";
import { getAllPhones } from "@/lib/phones";
import { toCardData } from "@/lib/cardData";
import {
  formatDday,
  formatManwon,
  formatPct,
  formatYearMonth,
} from "@/lib/format";
import { DOC_TYPES, TOOLS } from "@/lib/site";
import { webSiteJsonLd } from "@/lib/jsonld";
import PhoneCard from "@/components/phone/PhoneCard";
import Badge from "@/components/ui/Badge";
import DocIcon from "@/components/ui/DocIcon";
import JsonLd from "@/components/seo/JsonLd";
import { EOL_STATUS_META } from "@/lib/phones";

export const revalidate = 86400;

export default function Home() {
  const phones = getAllPhones();

  const endingSoon = phones
    .filter((p) => p.metrics.monthsLeftSecurity !== null)
    .sort(
      (a, b) =>
        (a.metrics.monthsLeftSecurity ?? 0) -
        (b.metrics.monthsLeftSecurity ?? 0),
    )
    .slice(0, 4);

  const residualTop = [...phones]
    .sort((a, b) => b.metrics.residualPct - a.metrics.residualPct)
    .slice(0, 6);

  const dataPoints = phones.reduce(
    (acc, p) => acc + p.resale.length + p.repairCosts.length + p.issues.length,
    0,
  );
  const latestAsOf = phones
    .map((p) => p.metrics.latestResaleDate)
    .sort()
    .at(-1);

  return (
    <>
      <JsonLd data={webSiteJsonLd()} />

      {/* 히어로 */}
      <section className="border-b border-hairline bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <Badge tone="accent" className="mb-4">
            휴대폰 결정 사전
          </Badge>
          <h1 className="mx-auto max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-[42px] sm:leading-[1.2]">
            이 폰, 사도 될까요?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-7 text-sub">
            스펙 나열은 다른 곳에 많습니다. 폰덱스는{" "}
            <strong className="font-semibold text-ink">
              사기 전(지원종료·수리비·이슈·적정가) · 쓰는 중(총소유비용·케어
              유불리) · 팔 때(타이밍·처분 루트)
            </strong>{" "}
            — 결정에 필요한 데이터만 기종별로 정리합니다.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/finder"
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-accent-strong"
            >
              내게 맞는 폰 찾기
            </Link>
            <Link
              href="/phones"
              className="rounded-full border border-hairline bg-card px-5 py-2.5 text-sm font-semibold text-sub transition-colors hover:border-accent-strong/40 hover:text-accent"
            >
              기종 목록
            </Link>
            <Link
              href="/best"
              className="rounded-full border border-hairline bg-card px-5 py-2.5 text-sm font-semibold text-sub transition-colors hover:border-accent-strong/40 hover:text-accent"
            >
              결정 랭킹
            </Link>
          </div>
          <p className="mt-8 text-xs text-mut">
            수록 기종 <strong className="tnum font-semibold text-sub">{phones.length}</strong>
            개 · 데이터 포인트{" "}
            <strong className="tnum font-semibold text-sub">{dataPoints}</strong>건 · 시세
            기준일 <span className="tnum">{latestAsOf}</span>
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-4 py-14 sm:px-6">
        {/* 인터랙티브 도구 */}
        <section aria-labelledby="tools">
          <h2 id="tools" className="text-xl font-bold tracking-tight">
            바로 쓰는 결정 도구
          </h2>
          <p className="mt-1 text-sm text-sub">
            문서를 읽기 전에, 지금 고민에 바로 답하는 도구부터.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TOOLS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="group rounded-xl border border-hairline bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-accent-strong/40 hover:shadow-pop"
              >
                <span className="inline-flex size-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <DocIcon name={t.icon} />
                </span>
                <p className="mt-3 text-sm font-bold group-hover:text-accent">
                  {t.label}
                </p>
                <p className="mt-1 text-xs leading-5 text-sub">{t.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* 지원 종료 임박 */}
        <section aria-labelledby="ending-soon">
          <div className="flex items-baseline justify-between">
            <h2 id="ending-soon" className="text-xl font-bold tracking-tight">
              보안지원 종료가 가까운 기종
            </h2>
            <Link
              href="/calendar"
              className="text-sm font-medium text-accent hover:underline"
            >
              전체 캘린더 →
            </Link>
          </div>
          <p className="mt-1 text-sm text-sub">
            보안 업데이트가 끝난 폰은 금융앱 사용이 위험해집니다. 지금 쓰는
            기종의 남은 수명을 확인하세요.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {endingSoon.map((p) => {
              const meta = p.metrics.eolStatus
                ? EOL_STATUS_META[p.metrics.eolStatus]
                : null;
              return (
                <Link
                  key={p.slug}
                  href={`/phones/${p.slug}/updates`}
                  className="group rounded-xl border border-hairline bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-pop"
                >
                  <div className="flex items-center justify-between">
                    {meta && (
                      <Badge tone={meta.tone} dot>
                        {meta.label}
                      </Badge>
                    )}
                    <span className="text-xs text-mut tnum">
                      {p.eol.securityEndDate &&
                        formatDday(p.eol.securityEndDate)}
                    </span>
                  </div>
                  <p className="mt-2.5 font-semibold group-hover:text-accent">
                    {p.name}
                  </p>
                  <p className="mt-1 text-xs text-sub">
                    보안지원{" "}
                    {p.eol.securityEndDate &&
                      formatYearMonth(p.eol.securityEndDate)}
                    까지{p.eol.estimated && " (추정)"}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 잔존가치 랭킹 */}
        <section aria-labelledby="residual-rank">
          <div className="flex items-baseline justify-between">
            <h2
              id="residual-rank"
              className="text-xl font-bold tracking-tight"
            >
              잔존가치 방어 랭킹
            </h2>
            <span className="text-xs text-mut">
              출시가 대비 현 중고 시세 · A급 중앙값 기준
            </span>
          </div>
          <div className="mt-5 overflow-hidden rounded-xl border border-hairline bg-card shadow-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-10">순위</th>
                  <th>기종</th>
                  <th className="hidden sm:table-cell">출시가</th>
                  <th>현 시세</th>
                  <th className="w-[38%]">잔존가치</th>
                </tr>
              </thead>
              <tbody>
                {residualTop.map((p, i) => (
                  <tr key={p.slug}>
                    <td className="tnum text-sub">{i + 1}</td>
                    <td>
                      <Link
                        href={`/phones/${p.slug}/resale`}
                        className="font-medium hover:text-accent"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="tnum hidden text-sub sm:table-cell">
                      {formatManwon(p.releasePriceKRW)}
                    </td>
                    <td className="tnum font-medium">
                      {formatManwon(p.metrics.latestResale)}
                    </td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-accent-soft">
                          <div
                            className="h-full rounded-full bg-accent-strong"
                            style={{
                              width: `${Math.min(100, p.metrics.residualPct)}%`,
                            }}
                          />
                        </div>
                        <span className="tnum w-11 text-right text-sm font-semibold">
                          {formatPct(p.metrics.residualPct, 0)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 문서 8종 소개 */}
        <section aria-labelledby="doc-types">
          <h2 id="doc-types" className="text-xl font-bold tracking-tight">
            모든 기종에 같은 여덟 문서
          </h2>
          <p className="mt-1 text-sm text-sub">
            사기 전 · 쓰는 중 · 팔 때 — 생애주기 전체를 기종마다 동일한
            구조로 정리하기 때문에, 어떤 폰이든 같은 기준으로 비교할 수
            있습니다.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DOC_TYPES.map((d) => (
              <div
                key={d.key}
                className="rounded-xl border border-hairline bg-card p-4 shadow-card"
              >
                <span className="inline-flex size-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <DocIcon name={d.icon} />
                </span>
                <p className="mt-3 text-sm font-bold">{d.label}</p>
                <p className="mt-1 text-xs leading-5 text-sub">{d.question}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 전체 기종 */}
        <section aria-labelledby="all-phones">
          <div className="flex items-baseline justify-between">
            <h2 id="all-phones" className="text-xl font-bold tracking-tight">
              수록 기종
            </h2>
            <Link
              href="/phones"
              className="text-sm font-medium text-accent hover:underline"
            >
              필터로 찾기 →
            </Link>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {phones.slice(0, 8).map((p) => (
              <PhoneCard key={p.slug} phone={toCardData(p)} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
