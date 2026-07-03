import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPhones, getPhone } from "@/lib/phones";
import { buildUsedCheck } from "@/lib/usedCheck";
import { formatManwon, formatMonthsAsYears } from "@/lib/format";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/jsonld";
import DocShell from "@/components/phone/DocShell";
import UsedCheckList from "@/components/phone/UsedCheckList";
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
  const { total } = buildUsedCheck(phone);
  return {
    title: `${phone.name} 중고 살 때 체크리스트 — 구매 전 확인 ${total}가지`,
    description: `${phone.name} 중고 구매 전 확인할 ${total}가지. 이 기종 특유의 이슈, 배터리·수리비 협상 포인트, A급 적정가 ${formatManwon(
      phone.metrics.latestResale,
    )}, 활성화 잠금·IMEI까지 한 번에 점검하세요.`,
    alternates: { canonical: `/phones/${model}/used-check` },
  };
}

export default async function UsedCheckPage({
  params,
}: {
  params: Promise<{ model: string }>;
}) {
  const { model } = await params;
  const phone = getPhone(model);
  if (!phone) notFound();

  const { sections, total, criticalCount } = buildUsedCheck(phone);
  const m = phone.metrics;

  const faq = [
    {
      q: `${phone.name} 중고로 사도 되나요?`,
      a: `데이터 기반 판정은 '${m.verdict.label}'입니다. ${m.verdict.reasons[0]} 중고 구매 시에는 아래 ${total}가지 체크리스트, 특히 필수 항목 ${criticalCount}가지를 반드시 확인하세요.`,
    },
    {
      q: `${phone.name} 중고 살 때 뭘 확인해야 하나요?`,
      a: `${sections
        .flatMap((s) => s.items.filter((i) => i.priority === "critical"))
        .map((i) => i.text.split(" — ")[0])
        .join(", ")} 등 필수 항목과, A급 적정 시세 ${formatManwon(
        m.latestResale,
      )} 대비 가격, 배터리 성능 상태를 확인하세요.`,
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
            {
              name: "중고 구매 체크리스트",
              path: `/phones/${phone.slug}/used-check`,
            },
          ]),
        ]}
      />
      <DocShell
        phone={phone}
        docKey="used-check"
        title={`${phone.name} 중고 구매 체크리스트`}
        lede={`이 기종의 알려진 이슈·수리비·적정 시세를 반영한 맞춤 점검표입니다. 필수 ${criticalCount}가지를 포함해 총 ${total}가지 — 거래 현장에서 하나씩 체크하며 확인하세요.`}
        asOf={m.latestResaleDate}
      >
        {/* 판정 요약 배너 */}
        <div className="rounded-xl border border-hairline bg-wash p-4 text-sm leading-6 text-sub">
          이 기종의 종합 판정은{" "}
          <strong className="font-semibold text-ink">
            {m.verdict.label}
          </strong>
          입니다.{" "}
          {m.monthsLeftSecurity !== null && m.monthsLeftSecurity > 0
            ? `보안 업데이트가 ${formatMonthsAsYears(
                m.monthsLeftSecurity,
              )} 남아 있어, 중고로 사도 그 기간만큼은 안심하고 쓸 수 있습니다.`
            : "보안 업데이트가 종료돼, 보조·서브폰 용도가 아니면 신중히 결정하세요."}
        </div>

        <UsedCheckList slug={phone.slug} sections={sections} total={total} />
      </DocShell>
    </>
  );
}
