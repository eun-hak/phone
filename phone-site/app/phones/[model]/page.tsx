import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BRAND_LABELS,
  CURATED_COMPARES,
  EOL_STATUS_META,
  canonicalCompareSlug,
  getAllPhones,
  getPhone,
} from "@/lib/phones";
import {
  formatDday,
  formatKoreanYearMonth,
  formatManwon,
  formatMonthsAsYears,
  formatPct,
  formatYearMonth,
} from "@/lib/format";
import { DOC_TYPES } from "@/lib/site";
import { computeSellTiming, computeTco } from "@/lib/insights";
import { breadcrumbJsonLd, phoneProductJsonLd } from "@/lib/jsonld";
import Badge from "@/components/ui/Badge";
import StatTile from "@/components/ui/StatTile";
import DocIcon from "@/components/ui/DocIcon";
import EolBar from "@/components/phone/EolBar";
import PhoneMedia from "@/components/phone/PhoneMedia";
import { getPhoneImage } from "@/lib/phoneImages";
import JsonLd from "@/components/seo/JsonLd";
import { buildUsedCheck } from "@/lib/usedCheck";

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPhones().map((p) => ({ model: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ model: string }>;
}): Promise<Metadata> {
  const { model } = await params;
  const phone = getPhone(model);
  if (!phone) return {};
  return {
    title: `${phone.name} — 사도 될까? 지원종료·수리비·시세 총정리`,
    description: `${phone.name} 구매 판단: ${phone.metrics.verdict.label}. 보안지원 ${
      phone.eol.securityEndDate
        ? formatYearMonth(phone.eol.securityEndDate) + "까지"
        : "미상"
    }, 잔존가치 ${formatPct(phone.metrics.residualPct, 0)}, 화면 수리비 ${
      phone.metrics.displayRepairKRW !== null
        ? formatManwon(phone.metrics.displayRepairKRW)
        : "미상"
    }.`,
    alternates: { canonical: `/phones/${model}` },
  };
}

const VERDICT_CARD_CLASSES: Record<string, string> = {
  good: "border-good/25 bg-good-soft/40",
  warn: "border-warn-strong/30 bg-warn-soft/40",
  serious: "border-serious-strong/30 bg-serious-soft/40",
  crit: "border-crit-strong/30 bg-crit-soft/40",
};

export default async function PhoneHubPage({
  params,
}: {
  params: Promise<{ model: string }>;
}) {
  const { model } = await params;
  const phone = getPhone(model);
  if (!phone) notFound();

  const m = phone.metrics;
  const eolMeta = m.eolStatus ? EOL_STATUS_META[m.eolStatus] : null;

  const docFacts: Record<string, string> = {
    updates: phone.eol.securityEndDate
      ? `보안지원 ${formatYearMonth(phone.eol.securityEndDate)}까지 · ${
          m.monthsLeftSecurity !== null && m.monthsLeftSecurity > 0
            ? `${formatMonthsAsYears(m.monthsLeftSecurity)} 남음`
            : "종료됨"
        }${phone.eol.estimated ? " (추정)" : ""}`
      : "종료일 미상",
    repair:
      m.displayRepairKRW !== null
        ? `화면 ${formatManwon(m.displayRepairKRW)} · 시세 대비 ${formatPct(m.repairBurdenPct ?? 0, 0)}`
        : "수리비 데이터 없음",
    issues:
      phone.issues.length > 0
        ? `${phone.issues.length}건 수록 · 중대 ${phone.issues.filter((i) => i.severity === "critical").length}건`
        : "보고된 고질 이슈 없음",
    buy: `자급제·지원금·알뜰폰 3루트 (기준일 ${phone.buyRoutes.asOf})`,
    resale: `현 시세 ${formatManwon(m.latestResale)} · 잔존가치 ${formatPct(m.residualPct, 0)}`,
  };

  const tco = computeTco(phone, 24);
  const tcoUsed = tco.scenarios.find((s) => s.key === "used-now");
  docFacts.tco =
    tcoUsed?.monthlyKRW != null
      ? `2년 보유 시 월 ${formatManwon(tcoUsed.monthlyKRW)} 꼴 (추정)`
      : "시세 기록이 쌓이면 월 환산 비용 계산";

  const careDisplay = phone.repairCosts.find(
    (r) => r.part === "display" && r.withCareKRW != null,
  );
  docFacts.care = careDisplay
    ? `화면 파손 시 ${formatManwon(careDisplay.officialKRW)} → ${formatManwon(careDisplay.withCareKRW!)} 절감 계산`
    : "보험료 입력형 손익분기 계산기";

  const timing = computeSellTiming(phone);
  const sixMo = timing.projections.find((x) => x.monthsAhead === 6);
  docFacts.sell =
    sixMo?.lossKRW != null && sixMo.lossKRW > 0
      ? `지금 ${formatManwon(timing.nowKRW)} · 6개월 미루면 −${formatManwon(sixMo.lossKRW)} (추정)`
      : `지금 팔면 ${formatManwon(timing.nowKRW)} · 처분 3루트 비교`;

  const usedCheck = buildUsedCheck(phone);

  const rivals = CURATED_COMPARES.filter(([a, b]) => a === model || b === model)
    .map(([a, b]) => {
      const otherSlug = a === model ? b : a;
      const other = getPhone(otherSlug);
      return other
        ? { slug: canonicalCompareSlug(a, b), name: other.name }
        : null;
    })
    .filter(Boolean) as Array<{ slug: string; name: string }>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <JsonLd
        data={[
          phoneProductJsonLd(phone),
          breadcrumbJsonLd([
            { name: "기종 목록", path: "/phones" },
            { name: phone.name, path: `/phones/${phone.slug}` },
          ]),
        ]}
      />

      <nav aria-label="브레드크럼" className="text-xs text-mut">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/phones" className="hover:text-accent">
              기종 목록
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-sub">{phone.name}</li>
        </ol>
      </nav>

      {/* 헤더 */}
      <header className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{BRAND_LABELS[phone.brand]}</Badge>
            <Badge tone="neutral">{phone.series} 시리즈</Badge>
            {eolMeta && (
              <Badge tone={eolMeta.tone} dot>
                {eolMeta.label}
              </Badge>
            )}
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {phone.name}
          </h1>
          <p className="mt-2 text-sm text-sub">
            {formatKoreanYearMonth(phone.releaseDate)} 출시 · 출시가{" "}
            {formatManwon(phone.releasePriceKRW)} ({phone.storageBase}) ·{" "}
            {phone.specSummary.chipset} · {phone.specSummary.displayInch}″ ·{" "}
            {phone.specSummary.batteryMah.toLocaleString("ko-KR")}mAh · RAM{" "}
            {phone.specSummary.ramGb}GB
          </p>
        </div>
        <PhoneMedia
          slug={phone.slug}
          name={phone.name}
          className="h-24 w-24 shrink-0 border border-hairline shadow-card sm:h-28 sm:w-28"
          sizePx={224}
        />
      </header>

      {/* 결정 요약 */}
      <section
        aria-labelledby="verdict"
        className={`mt-6 rounded-2xl border p-5 sm:p-6 ${VERDICT_CARD_CLASSES[m.verdict.tone]}`}
      >
        <h2 id="verdict" className="sr-only">
          구매 판단 요약
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={m.verdict.tone} dot className="text-sm">
            {m.verdict.label}
          </Badge>
          <span className="text-xs text-mut">
            데이터 기반 자동 판정 · 시세 기준일 {m.latestResaleDate}
          </span>
        </div>
        <ul className="mt-4 space-y-2">
          {m.verdict.reasons.map((r) => (
            <li key={r} className="flex gap-2 text-sm leading-6 text-ink">
              <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-sub" />
              {r}
            </li>
          ))}
        </ul>
      </section>

      {/* 핵심 지표 */}
      <section aria-label="핵심 지표" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="보안지원 잔여"
          value={
            m.monthsLeftSecurity !== null && m.monthsLeftSecurity > 0
              ? formatMonthsAsYears(m.monthsLeftSecurity)
              : "종료"
          }
          sub={
            phone.eol.securityEndDate
              ? `${formatYearMonth(phone.eol.securityEndDate)}까지 · ${formatDday(phone.eol.securityEndDate)}`
              : undefined
          }
          badge={
            phone.eol.estimated ? <Badge tone="warn">추정</Badge> : undefined
          }
        />
        <StatTile
          label="잔존가치"
          value={formatPct(m.residualPct, 0)}
          sub={`출시가 ${formatManwon(phone.releasePriceKRW)} → 현 시세 ${formatManwon(m.latestResale)}`}
        />
        <StatTile
          label="화면 수리비"
          value={
            m.displayRepairKRW !== null
              ? formatManwon(m.displayRepairKRW)
              : "—"
          }
          sub={
            m.repairBurdenPct !== null
              ? `현 시세의 ${formatPct(m.repairBurdenPct, 0)} (부담률)`
              : undefined
          }
        />
        <StatTile
          label="알려진 이슈"
          value={`${phone.issues.length}건`}
          sub={
            phone.issues.length > 0
              ? `중대 ${phone.issues.filter((i) => i.severity === "critical").length}건 포함`
              : "보고된 고질 이슈 없음"
          }
        />
      </section>

      {/* 수명 진행 바 */}
      {phone.eol.securityEndDate && m.supportElapsedPct !== null && (
        <section
          aria-label="지원 수명 진행"
          className="mt-6 rounded-xl border border-hairline bg-card p-5 shadow-card"
        >
          <EolBar
            releaseDate={phone.releaseDate}
            securityEndDate={phone.eol.securityEndDate}
            elapsedPct={m.supportElapsedPct}
          />
        </section>
      )}

      {/* 문서 5종 */}
      <section aria-labelledby="docs" className="mt-10">
        <h2 id="docs" className="text-xl font-bold tracking-tight">
          {phone.name} 결정 문서
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DOC_TYPES.map((d) => (
            <Link
              key={d.key}
              href={`/phones/${phone.slug}/${d.key}`}
              className="group flex items-start gap-3.5 rounded-xl border border-hairline bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-accent-strong/40 hover:shadow-pop"
            >
              <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <DocIcon name={d.icon} />
              </span>
              <span>
                <span className="block text-sm font-bold group-hover:text-accent">
                  {d.label}
                </span>
                <span className="mt-0.5 block text-xs text-mut">
                  {d.question}
                </span>
                <span className="mt-1.5 block text-xs leading-5 text-sub">
                  {docFacts[d.key]}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 중고 구매 체크리스트 CTA */}
      <section aria-label="중고 구매 체크리스트" className="mt-6">
        <Link
          href={`/phones/${phone.slug}/used-check`}
          className="group flex items-center gap-4 rounded-2xl border border-accent-strong/30 bg-accent-soft p-5 transition-colors hover:border-accent-strong/60"
        >
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-card text-accent shadow-card">
            <DocIcon name="cart" className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-bold text-ink group-hover:text-accent">
              {phone.name} 중고로 살 계획인가요?
            </span>
            <span className="mt-0.5 block text-sm leading-6 text-sub">
              이 기종의 알려진 이슈·수리비·적정가를 반영한 맞춤 체크리스트{" "}
              {usedCheck.total}항목 (필수 {usedCheck.criticalCount}가지)
            </span>
          </span>
          <span
            aria-hidden="true"
            className="shrink-0 text-accent transition-transform group-hover:translate-x-0.5"
          >
            →
          </span>
        </Link>
      </section>

      {/* 비교 추천 */}
      {rivals.length > 0 && (
        <section aria-labelledby="rivals" className="mt-10">
          <h2 id="rivals" className="text-xl font-bold tracking-tight">
            함께 고민하는 기종
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {rivals.map((r) => (
              <Link
                key={r.slug}
                href={`/compare/${r.slug}`}
                className="rounded-full border border-hairline bg-card px-4 py-2 text-sm font-medium text-sub transition-colors hover:border-accent-strong/40 hover:text-accent"
              >
                {phone.name} vs {r.name} →
              </Link>
            ))}
          </div>
        </section>
      )}

      {(() => {
        const img = getPhoneImage(phone.slug);
        return img ? (
          <p className="mt-10 text-xs leading-5 text-mut">
            제품 사진:{" "}
            <a
              href={img.sourceUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="underline decoration-hairline underline-offset-2 hover:text-accent"
            >
              {img.artist}
            </a>{" "}
            ({img.license}), Wikimedia Commons
          </p>
        ) : null;
      })()}

      <p className="mt-3 text-xs leading-5 text-mut">
        스펙 상세는{" "}
        <a
          href={phone.buyRoutes.danawaUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="underline underline-offset-2 hover:text-accent"
        >
          다나와
        </a>
        와 제조사 페이지를 참고하세요. 폰덱스는 결정에 필요한 데이터만
        다룹니다.
      </p>
    </div>
  );
}
