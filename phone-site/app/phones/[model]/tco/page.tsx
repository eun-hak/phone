import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPhones, getPhone } from "@/lib/phones";
import { computeTco, projectResale } from "@/lib/insights";
import { formatKRW, formatManwon, formatPct } from "@/lib/format";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/jsonld";
import DocShell from "@/components/phone/DocShell";
import StatTile from "@/components/ui/StatTile";
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
  const tco = computeTco(phone, 24);
  const used = tco.scenarios.find((s) => s.key === "used-now");
  return {
    title: `${phone.name} 총소유비용(TCO) — 월 얼마에 쓰는 셈일까`,
    description: `${phone.name}을(를) 지금 사서 2년 쓰면 실제 부담은 ${
      used?.monthlyKRW != null
        ? `월 약 ${formatManwon(used.monthlyKRW)}`
        : "시세 기록이 쌓이면 계산됩니다"
    }. 구매가에서 2년 뒤 예상 매도가를 뺀 순비용으로 계산합니다.`,
    alternates: { canonical: `/phones/${model}/tco` },
  };
}

export default async function TcoPage({
  params,
}: {
  params: Promise<{ model: string }>;
}) {
  const { model } = await params;
  const phone = getPhone(model);
  if (!phone) notFound();

  const m = phone.metrics;
  const tco24 = computeTco(phone, 24);
  const tco36 = computeTco(phone, 36);
  const used24 = tco24.scenarios.find((s) => s.key === "used-now")!;
  const used36 = tco36.scenarios.find((s) => s.key === "used-now")!;

  const projections = [6, 12, 24, 36].map((n) => ({
    monthsAhead: n,
    priceKRW: projectResale(phone, n),
  }));

  const faq = [
    {
      q: `${phone.name}, 한 달에 얼마 쓰는 셈인가요?`,
      a:
        used24.monthlyKRW != null
          ? `지금 중고 A급(${formatKRW(used24.buyKRW)})에 사서 2년 뒤 예상 시세에 되판다고 가정하면, 기기값 순비용은 월 약 ${formatKRW(used24.monthlyKRW)}입니다. 요금제·액세서리는 제외한 값입니다.`
          : "시세 기록이 2개월 이상 쌓이면 월 환산 비용이 계산됩니다.",
    },
    {
      q: "TCO(총소유비용)가 왜 구매가보다 중요한가요?",
      a: "폰의 실부담은 '산 가격'이 아니라 '산 가격 − 판 가격'입니다. 잔존가치가 높은 기종은 비싸게 사도 실부담이 작을 수 있고, 싸게 사도 감가가 가파르면 실부담이 커집니다.",
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
            { name: "총소유비용", path: `/phones/${phone.slug}/tco` },
          ]),
        ]}
      />
      <DocShell
        phone={phone}
        docKey="tco"
        title={`${phone.name} 총소유비용 (TCO)`}
        lede="'얼마에 사느냐'가 아니라 '얼마를 쓰고 얼마를 돌려받느냐'로 계산합니다. 구매가 − 예상 매도가 = 진짜 부담."
        asOf={m.latestResaleDate}
      >
        <section
          aria-label="TCO 요약"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatTile
            label="월 실질 비용 (2년 보유)"
            value={
              used24.monthlyKRW != null
                ? `${formatManwon(used24.monthlyKRW)}/월`
                : "—"
            }
            sub="지금 중고 A급 구매 기준 · 추정"
          />
          <StatTile
            label="월 실질 비용 (3년 보유)"
            value={
              used36.monthlyKRW != null
                ? `${formatManwon(used36.monthlyKRW)}/월`
                : "—"
            }
            sub="오래 쓸수록 월 부담은 낮아집니다"
          />
          <StatTile
            label="지금 구매가 (A급)"
            value={formatManwon(m.latestResale)}
            sub={`기준일 ${m.latestResaleDate}`}
          />
          <StatTile
            label="2년 뒤 예상 매도가"
            value={
              used24.exitKRW != null ? formatManwon(used24.exitKRW) : "—"
            }
            sub="월평균 하락액 선형 외삽 · 추정"
          />
        </section>

        {/* 시나리오 표 */}
        <section aria-label="구매 시나리오 비교">
          <h2 className="text-lg font-bold tracking-tight">
            구매 시나리오별 순비용 (24개월 보유)
          </h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-hairline bg-card shadow-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>시나리오</th>
                  <th className="text-right">구매가</th>
                  <th className="text-right">2년 뒤 매도가</th>
                  <th className="text-right">순비용</th>
                  <th className="text-right">월 환산</th>
                </tr>
              </thead>
              <tbody>
                {tco24.scenarios.map((s) => (
                  <tr key={s.key}>
                    <td className="font-medium">{s.label}</td>
                    <td className="tnum text-right">{formatKRW(s.buyKRW)}</td>
                    <td className="tnum text-right text-sub">
                      {s.exitKRW != null ? formatKRW(s.exitKRW) : "—"}
                    </td>
                    <td className="tnum text-right font-semibold">
                      {s.netKRW != null ? formatKRW(s.netKRW) : "—"}
                    </td>
                    <td className="tnum text-right font-semibold text-accent">
                      {s.monthlyKRW != null
                        ? `${formatManwon(s.monthlyKRW)}/월`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="mt-3 space-y-1">
            {tco24.scenarios
              .flatMap((s) => s.notes)
              .concat(tco24.assumptions)
              .map((n) => (
                <li key={n} className="text-xs leading-5 text-mut">
                  · {n}
                </li>
              ))}
          </ul>
        </section>

        {/* 보유 기간 체크 */}
        <section aria-label="보유 기간과 지원 수명">
          <h2 className="text-lg font-bold tracking-tight">
            보유 기간이 지원 수명 안에 들어오나?
          </h2>
          <div
            className={`mt-4 rounded-xl border p-5 ${
              tco24.supportCoversHorizon === false
                ? "border-serious-strong/30 bg-serious-soft/40"
                : "border-hairline bg-card shadow-card"
            }`}
          >
            {tco24.supportCoversHorizon === null ? (
              <p className="text-sm leading-6 text-sub">
                지원 종료일 데이터가 없어 판정할 수 없습니다.
              </p>
            ) : tco24.supportCoversHorizon ? (
              <p className="text-sm leading-6 text-ink">
                <strong className="font-semibold">문제 없음</strong> — 2년 보유
                계획은 보안지원 기간(
                {m.monthsLeftSecurity !== null &&
                  `${Math.floor(m.monthsLeftSecurity / 12)}년 ${m.monthsLeftSecurity % 12}개월 남음`}
                ) 안에 충분히 들어옵니다.
              </p>
            ) : (
              <p className="text-sm leading-6 text-ink">
                <strong className="font-semibold text-serious">주의</strong> —
                2년을 다 쓰기 전에 보안지원이 끝납니다. 지원 종료 후에는 금융앱
                사용이 위험해지고 시세도 한 단계 내려가는 경향이 있습니다.{" "}
                <Link
                  href={`/phones/${phone.slug}/updates`}
                  className="font-medium text-accent underline underline-offset-2"
                >
                  지원종료 문서에서 정확한 날짜 확인 →
                </Link>
              </p>
            )}
            {tco24.batteryAddonKRW !== null && (
              <p className="mt-2 text-xs leading-5 text-sub">
                장기 보유 시 배터리 1회 교체(
                {formatManwon(tco24.batteryAddonKRW)})를 순비용에 더해
                계산하세요. 3년 이상 보유라면 사실상 필수 비용입니다.
              </p>
            )}
          </div>
        </section>

        {/* 프로젝션 표 */}
        <section aria-label="예상 시세 프로젝션">
          <h2 className="text-lg font-bold tracking-tight">
            예상 시세 프로젝션
          </h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-hairline bg-card shadow-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>시점</th>
                  <th className="text-right">예상 시세 (A급)</th>
                  <th className="text-right">현재 대비</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-medium">현재</td>
                  <td className="tnum text-right font-semibold">
                    {formatKRW(m.latestResale)}
                  </td>
                  <td className="tnum text-right text-sub">—</td>
                </tr>
                {projections.map((pr) => (
                  <tr key={pr.monthsAhead}>
                    <td className="font-medium">{pr.monthsAhead}개월 뒤</td>
                    <td className="tnum text-right">
                      {pr.priceKRW != null ? formatKRW(pr.priceKRW) : "—"}
                    </td>
                    <td className="tnum text-right text-sub">
                      {pr.priceKRW != null
                        ? `−${formatPct(((m.latestResale - pr.priceKRW) / m.latestResale) * 100, 0)}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-5 text-mut">
            프로젝션은 지금까지 기록된 월평균 하락액을 선형으로 늘린
            추정치이며(하한: 출시가의 7%), 신형 발표·단종 등 이벤트로 실제와
            달라질 수 있습니다. 판단 참고용으로만 쓰세요.
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
