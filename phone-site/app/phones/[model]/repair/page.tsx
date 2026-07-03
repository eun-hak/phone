import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllPhones,
  getPhone,
  REPAIR_PART_LABELS,
} from "@/lib/phones";
import { formatKRW, formatManwon, formatPct } from "@/lib/format";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/jsonld";
import DocShell from "@/components/phone/DocShell";
import Badge from "@/components/ui/Badge";
import SourceNote from "@/components/ui/SourceNote";
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
  const display = phone.repairCosts.find((r) => r.part === "display");
  return {
    title: `${phone.name} 수리비 총정리 — 화면·배터리 공식 가격`,
    description: `${phone.name} 공식 수리비: ${phone.repairCosts
      .map((r) => `${REPAIR_PART_LABELS[r.part]} ${formatManwon(r.officialKRW)}`)
      .join(", ")}.${
      display ? ` 화면 수리비는 현 중고 시세 대비 ${formatPct(phone.metrics.repairBurdenPct ?? 0, 0)}.` : ""
    }`,
    alternates: { canonical: `/phones/${model}/repair` },
  };
}

export default async function RepairPage({
  params,
}: {
  params: Promise<{ model: string }>;
}) {
  const { model } = await params;
  const phone = getPhone(model);
  if (!phone) notFound();

  const m = phone.metrics;
  const burdenHigh = (m.repairBurdenPct ?? 0) >= 60;

  const display = phone.repairCosts.find((r) => r.part === "display");
  const battery = phone.repairCosts.find((r) => r.part === "battery");

  const faq = [
    ...(display
      ? [
          {
            q: `${phone.name} 화면(액정) 수리비는 얼마인가요?`,
            a: `공식 서비스 기준 ${formatKRW(display.officialKRW)}입니다.${
              display.withCareKRW !== undefined
                ? ` 보험(케어) 가입 시 자기부담금은 ${
                    display.withCareKRW === 0
                      ? "무상"
                      : formatKRW(display.withCareKRW)
                  }입니다.`
                : ""
            } (기준일 ${display.source.asOf})`,
          },
        ]
      : []),
    ...(battery
      ? [
          {
            q: `${phone.name} 배터리 교체 비용은 얼마인가요?`,
            a: `공식 서비스 기준 ${formatKRW(battery.officialKRW)}입니다. 배터리 성능 저하가 체감되면 기기 교체보다 배터리 교체가 훨씬 경제적입니다. (기준일 ${battery.source.asOf})`,
          },
        ]
      : []),
    {
      q: "사설 수리가 더 싸지 않나요?",
      a: "부품에 따라 30~50% 저렴할 수 있지만, 정품 부품 여부·방수 실링 복원·잔여 보증 상실 여부를 반드시 확인해야 합니다. 특히 화면은 사설 수리 이력이 있으면 중고 매입가가 크게 깎입니다.",
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
            { name: "공식 수리비", path: `/phones/${phone.slug}/repair` },
          ]),
        ]}
      />
      <DocShell
        phone={phone}
        docKey="repair"
        title={`${phone.name} 공식 수리비`}
        lede="제조사 공식 서비스 기준 부품별 수리 비용입니다. 보험(케어) 가입 여부에 따라 실부담이 크게 달라집니다."
        asOf={phone.repairCosts[0]?.source.asOf}
      >
        <section aria-label="수리비 표">
          <div className="overflow-hidden rounded-xl border border-hairline bg-card shadow-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>부품</th>
                  <th className="text-right">공식 수리비</th>
                  <th className="text-right">케어 가입 시</th>
                </tr>
              </thead>
              <tbody>
                {phone.repairCosts.map((r) => (
                  <tr key={r.part}>
                    <td className="font-medium">
                      {REPAIR_PART_LABELS[r.part]}
                    </td>
                    <td className="tnum text-right font-semibold">
                      {formatKRW(r.officialKRW)}
                    </td>
                    <td className="tnum text-right text-sub">
                      {r.withCareKRW === undefined
                        ? "—"
                        : r.withCareKRW === 0
                          ? "무상"
                          : formatKRW(r.withCareKRW)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <SourceNote sources={phone.repairCosts.map((r) => r.source)} />
        </section>

        {m.repairBurdenPct !== null && m.displayRepairKRW !== null && (
          <section
            aria-label="수리비 부담률"
            className={`rounded-xl border p-5 ${
              burdenHigh
                ? "border-serious-strong/30 bg-serious-soft/40"
                : "border-hairline bg-card shadow-card"
            }`}
          >
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold">수리 vs 교체 판단</h2>
              <Badge tone={burdenHigh ? "serious" : "good"} dot>
                부담률 {formatPct(m.repairBurdenPct, 0)}
              </Badge>
            </div>
            <p className="mt-2.5 text-sm leading-6 text-sub">
              화면 수리비 {formatManwon(m.displayRepairKRW)}는 이 기종의 현
              중고 시세({formatManwon(m.latestResale)})의{" "}
              {formatPct(m.repairBurdenPct, 0)}입니다.{" "}
              {burdenHigh
                ? "보험 없이 화면이 파손됐다면, 수리하는 것보다 파손폰을 부품용으로 처분하고 같은 기종 중고를 사는 편이 경제적일 수 있습니다."
                : "수리비가 시세 대비 합리적인 구간이라, 파손 시 수리해서 계속 쓰는 선택이 유효합니다."}
            </p>
          </section>
        )}

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

        <p className="text-sm text-sub">
          다른 기종과 수리비를 비교하려면{" "}
          <Link
            href="/repair-cost"
            className="font-medium text-accent hover:underline"
          >
            전체 기종 수리비 비교표
          </Link>
          를 확인하세요.
        </p>
      </DocShell>
    </>
  );
}
