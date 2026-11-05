import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPhones, getPhone, REPAIR_PART_LABELS } from "@/lib/phones";
import { formatKRW, formatManwon, formatPct } from "@/lib/format";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/jsonld";
import DocShell from "@/components/phone/DocShell";
import SourceNote from "@/components/ui/SourceNote";
import JsonLd from "@/components/seo/JsonLd";
import CareCalculator from "./CareCalculator";

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPhones().map((p) => ({ model: p.slug }));
}

const CARE_NAME: Record<"samsung" | "apple", string> = {
  samsung: "삼성케어플러스",
  apple: "AppleCare+",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ model: string }>;
}): Promise<Metadata> {
  const { model } = await params;
  const phone = getPhone(model);
  if (!phone) return {};
  return {
    title: `${phone.name} ${CARE_NAME[phone.brand]} 들까 말까 — 손익분기 계산기`,
    description: `${phone.name} 화면 수리비 ${
      phone.metrics.displayRepairKRW !== null
        ? formatManwon(phone.metrics.displayRepairKRW)
        : "데이터 기준"
    } 기준으로 ${CARE_NAME[phone.brand]} 가입의 손익분기 파손 확률을 계산합니다. 보험료를 입력하면 이득/손해 구간이 바로 나옵니다.`,
    alternates: { canonical: `/phones/${model}/care` },
  };
}

export default async function CarePage({
  params,
}: {
  params: Promise<{ model: string }>;
}) {
  const { model } = await params;
  const phone = getPhone(model);
  if (!phone) notFound();

  const m = phone.metrics;
  const careName = CARE_NAME[phone.brand];
  const sortedParts = [...phone.repairCosts].sort((a, b) =>
    a.part === "display" ? -1 : b.part === "display" ? 1 : 0,
  );

  const highBurden = m.repairBurdenPct !== null && m.repairBurdenPct >= 50;

  const faq = [
    {
      q: `${phone.name}에 ${careName}를 드는 게 이득인가요?`,
      a:
        m.displayRepairKRW !== null
          ? `이 기종의 무보험 화면 수리비는 ${formatKRW(m.displayRepairKRW)}로 현 중고 시세의 ${formatPct(m.repairBurdenPct ?? 0, 0)}입니다. ${
              highBurden
                ? "수리비 부담이 큰 기종이라, 파손 이력이 있거나 케이스 없이 쓰는 편이면 가입이 유리한 편입니다."
                : "수리비 부담이 아주 크지는 않아, 파손 확률이 낮은 사용 습관이면 무보험도 합리적입니다."
            } 페이지의 계산기에 실제 견적 보험료를 넣어 확인하세요.`
          : "이 기종은 수리비 데이터가 아직 없어 일반 기준으로 판단해야 합니다.",
    },
    {
      q: "언제 가입할 수 있나요?",
      a:
        phone.brand === "apple"
          ? "AppleCare+는 기기 구매 후 60일 이내에만 가입할 수 있습니다. 중고 구매 기기는 원칙적으로 가입이 어렵습니다."
          : "삼성케어플러스는 통상 구매 후 30~60일 이내 가입 조건이 있으며, 프로모션에 따라 다릅니다. 중고 기기는 대상이 아닌 플랜이 많습니다.",
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
            { name: "케어 유불리", path: `/phones/${phone.slug}/care` },
          ]),
        ]}
      />
      <DocShell
        phone={phone}
        docKey="care"
        title={`${phone.name} ${careName} 들까 말까`}
        lede="보험은 감정이 아니라 기대값 문제입니다. 무보험 수리비 × 파손 확률과 총 보험료를 비교해 손익분기를 계산합니다."
      >
        {/* 수리비 비교 표 */}
        <section aria-label="보험 유무별 수리비">
          <h2 className="text-lg font-bold tracking-tight">
            보험 유무별 수리비
          </h2>
          {sortedParts.length > 0 ? (
            <>
              <div className="mt-4 overflow-hidden rounded-xl border border-hairline bg-card shadow-card">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>부품</th>
                      <th className="text-right">무보험 (공식)</th>
                      <th className="text-right">{careName} 자기부담</th>
                      <th className="text-right">1회 절감액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedParts.map((r) => (
                      <tr key={r.part}>
                        <td className="font-medium">
                          {REPAIR_PART_LABELS[r.part]}
                        </td>
                        <td className="tnum text-right">
                          {formatKRW(r.officialKRW)}
                        </td>
                        <td className="tnum text-right">
                          {r.withCareKRW != null
                            ? formatKRW(r.withCareKRW)
                            : "—"}
                        </td>
                        <td className="tnum text-right font-semibold text-accent">
                          {r.withCareKRW != null
                            ? formatKRW(r.officialKRW - r.withCareKRW)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <SourceNote sources={sortedParts.map((r) => r.source)} />
            </>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-hairline bg-card p-5 text-sm leading-6 text-sub shadow-card">
              이 기종의 수리비 데이터가 아직 수록되지 않았습니다.
            </p>
          )}
        </section>

        {/* 계산기 */}
        <section aria-label="손익분기 계산기">
          <h2 className="text-lg font-bold tracking-tight">
            손익분기 계산기
          </h2>
          <p className="mt-1 text-sm text-sub">
            {careName} 견적 보험료를 넣으면, 어느 파손 확률부터 가입이
            이득인지 계산합니다.
          </p>
          <div className="mt-4">
            <CareCalculator
              brand={phone.brand}
              parts={sortedParts.map((r) => ({
                label: REPAIR_PART_LABELS[r.part],
                officialKRW: r.officialKRW,
                withCareKRW: r.withCareKRW ?? null,
              }))}
            />
          </div>
        </section>

        {/* 판단 가이드 */}
        <section aria-label="판단 가이드">
          <h2 className="text-lg font-bold tracking-tight">
            이 기종의 판단 포인트
          </h2>
          <ul className="mt-4 space-y-2">
            {m.repairBurdenPct !== null && (
              <li className="flex gap-2 rounded-xl border border-hairline bg-card p-4 text-sm leading-6 shadow-card">
                <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-sub" />
                <span>
                  화면 수리비가 현 시세의{" "}
                  <strong className="tnum font-semibold">
                    {formatPct(m.repairBurdenPct, 0)}
                  </strong>
                  {highBurden
                    ? " — 무보험 파손 시 타격이 큰 기종입니다. 파손 이력이 있다면 가입 쪽이 안전합니다."
                    : " — 파손 시 타격이 감당 가능한 수준입니다. 케이스·필름을 쓰는 편이면 무보험도 합리적입니다."}
                </span>
              </li>
            )}
            <li className="flex gap-2 rounded-xl border border-hairline bg-card p-4 text-sm leading-6 shadow-card">
              <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-sub" />
              <span>
                {phone.brand === "apple"
                  ? "AppleCare+는 구매 후 60일 이내 가입 제한이 있습니다. 지금 가입 가능 기간인지부터 확인하세요."
                  : "삼성케어플러스는 파손보장형·종합보장형 등 플랜별 보장 범위가 다릅니다. 견적 시 플랜명을 확인하세요."}
              </span>
            </li>
            <li className="flex gap-2 rounded-xl border border-hairline bg-card p-4 text-sm leading-6 shadow-card">
              <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-sub" />
              <span>
                통신사 보험(T올케어·KT폰안심 등)은 제조사 케어와 보장·자기부담이
                다릅니다. 같은 계산법(총 보험료 vs 절감액×확률)으로 비교하면
                됩니다.
              </span>
            </li>
          </ul>
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
