import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPhones, getPhone } from "@/lib/phones";
import { formatKRW, formatManwon, formatPct } from "@/lib/format";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/jsonld";
import DocShell from "@/components/phone/DocShell";
import StatTile from "@/components/ui/StatTile";
import ResaleChart from "@/components/charts/ResaleChart";
import JsonLd from "@/components/seo/JsonLd";

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
    title: `${phone.name} 중고 시세 추이 — 잔존가치 ${formatPct(phone.metrics.residualPct, 0)}`,
    description: `${phone.name} 중고 시세(A급 중앙값): ${formatManwon(phone.metrics.latestResale)} (기준일 ${phone.metrics.latestResaleDate}). 출시가 대비 잔존가치 ${formatPct(phone.metrics.residualPct, 0)}${
      phone.metrics.avgMonthlyDropPct !== null
        ? `, 월평균 하락률 ${formatPct(phone.metrics.avgMonthlyDropPct)}`
        : ""
    }.`,
    alternates: { canonical: `/phones/${model}/resale` },
  };
}

export default async function ResalePage({
  params,
}: {
  params: Promise<{ model: string }>;
}) {
  const { model } = await params;
  const phone = getPhone(model);
  if (!phone) notFound();

  const m = phone.metrics;
  const sorted = [...phone.resale].sort((a, b) => a.date.localeCompare(b.date));

  const faq = [
    {
      q: `${phone.name} 중고 시세는 얼마인가요?`,
      a: `${m.latestResaleDate} 기준 A급 중앙값 ${formatKRW(m.latestResale)}입니다. 상태·구성품·배터리 성능에 따라 ±10% 이상 차이 날 수 있습니다.`,
    },
    m.avgMonthlyDropPct !== null
      ? {
          q: "지금 파는 게 나을까요, 더 쓰는 게 나을까요?",
          a: `이 기종은 최근 월평균 ${formatPct(m.avgMonthlyDropPct)}씩 시세가 내려가고 있습니다. 갈아탈 계획이 확정이라면 미룰수록 손해이고, 계속 쓸 계획이라면 시세 하락은 무시해도 됩니다.`,
        }
      : {
          q: "시세 추이는 왜 아직 없나요?",
          a: "폰덱스는 매월 같은 기준(A급·중앙값)으로 시세를 직접 기록합니다. 이 기종은 추적을 시작한 지 얼마 되지 않아, 기록이 3개월 이상 쌓이면 추이 차트가 공개됩니다.",
        },
  ];

  return (
    <>
      <JsonLd
        data={[
          faqJsonLd(faq),
          breadcrumbJsonLd([
            { name: "기종 목록", path: "/phones" },
            { name: phone.name, path: `/phones/${phone.slug}` },
            { name: "잔존가치", path: `/phones/${phone.slug}/resale` },
          ]),
        ]}
      />
      <DocShell
        phone={phone}
        docKey="resale"
        title={`${phone.name} 중고 시세 · 잔존가치`}
        lede="매월 같은 기준(A급·중앙값)으로 기록한 시세 추이입니다. 지금 사면 얼마에 사고, 나중에 팔면 얼마가 남는지의 감각을 잡는 문서입니다."
        asOf={m.latestResaleDate}
      >
        <section
          aria-label="시세 요약"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatTile
            label="현 시세 (A급 중앙값)"
            value={formatManwon(m.latestResale)}
            sub={`기준일 ${m.latestResaleDate}`}
          />
          <StatTile
            label="잔존가치"
            value={formatPct(m.residualPct, 0)}
            sub={`출시가 ${formatManwon(phone.releasePriceKRW)} 대비`}
          />
          <StatTile
            label="월평균 하락률"
            value={
              m.avgMonthlyDropPct !== null
                ? formatPct(m.avgMonthlyDropPct)
                : "—"
            }
            sub={
              m.avgMonthlyDropPct !== null
                ? `최근 ${sorted.length}개월 추적 기준`
                : "기록 2개월 이상 쌓이면 계산"
            }
          />
          <StatTile
            label="추적 시작 대비"
            value={
              sorted.length >= 2
                ? formatManwon(sorted[0].priceKRW - m.latestResale)
                : "—"
            }
            sub={
              sorted.length >= 2
                ? `${sorted[0].date.slice(0, 7)} 이후 하락 폭`
                : `${sorted[0].date.slice(0, 7)} 추적 시작`
            }
          />
        </section>

        <section aria-label="시세 차트">
          <h2 className="text-lg font-bold tracking-tight">시세 추이</h2>
          {sorted.length >= 3 ? (
            <div className="mt-4 rounded-xl border border-hairline bg-card p-4 shadow-card sm:p-5">
              <ResaleChart
                points={sorted.map((p) => ({
                  date: p.date,
                  priceKRW: p.priceKRW,
                }))}
                label={phone.name}
              />
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-hairline bg-card p-6 text-center shadow-card">
              <p className="text-sm font-semibold">시세 추적을 시작했습니다</p>
              <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-sub">
                매월 초 같은 기준(A급 개인거래·복수 소스 교차)으로 시세를
                기록합니다. 기록이 3개월 이상 쌓이면 이 자리에 추이 차트가
                열립니다.
              </p>
            </div>
          )}
        </section>

        <section aria-label="시세 표">
          <h2 className="text-lg font-bold tracking-tight">월별 기록</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-hairline bg-card shadow-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>기준일</th>
                  <th className="text-right">시세 (A급 중앙값)</th>
                  <th className="text-right">전월 대비</th>
                  <th className="text-right">잔존가치</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p, i) => {
                  const prev = i > 0 ? sorted[i - 1].priceKRW : null;
                  const diff = prev !== null ? p.priceKRW - prev : null;
                  return (
                    <tr key={p.date}>
                      <td className="tnum">{p.date}</td>
                      <td className="tnum text-right font-medium">
                        {formatKRW(p.priceKRW)}
                      </td>
                      <td className="tnum text-right text-sub">
                        {diff === null
                          ? "—"
                          : `${diff > 0 ? "+" : ""}${diff.toLocaleString("ko-KR")}원`}
                      </td>
                      <td className="tnum text-right text-sub">
                        {formatPct((p.priceKRW / phone.releasePriceKRW) * 100, 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-5 text-mut">
            집계 기준: 세티즌 평균 실거래가, 번개장터 매물 호가 중앙값(파손·할부
            매물 제외), 민팃 A급 매입가(개인거래가 대비 약 25~30% 낮음을
            보정)를 교차해 상태 A급 개인거래 시세를 산출합니다. 매월 초 같은
            기준으로 기록하며, 소스 간 편차가 큰 기종은 그 사실을 함께
            표기합니다.
          </p>
        </section>

        <section aria-label="자주 묻는 질문">
          <h2 className="text-lg font-bold tracking-tight">자주 묻는 질문</h2>
          <dl className="mt-4 space-y-4">
            {faq.map((f) => (
              <div
                key={f.q}
                className="rounded-xl border border-hairline bg-card p-4 shadow-card"
              >
                <dt className="text-sm font-semibold">{f.q}</dt>
                <dd className="mt-1.5 text-sm leading-6 text-sub">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </DocShell>
    </>
  );
}
