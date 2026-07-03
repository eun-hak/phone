import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPhones, getPhone } from "@/lib/phones";
import { formatManwon, formatPct } from "@/lib/format";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/jsonld";
import DocShell from "@/components/phone/DocShell";
import Badge from "@/components/ui/Badge";
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
    title: `${phone.name} 싸게 사는 법 — 자급제 vs 지원금 vs 알뜰폰`,
    description: `${phone.name} 구매 루트 비교. 현 중고 시세 ${formatManwon(phone.metrics.latestResale)} 기준으로 신품·중고·통신사 루트의 손익을 정리했습니다.`,
    alternates: { canonical: `/phones/${model}/buy` },
  };
}

export default async function BuyPage({
  params,
}: {
  params: Promise<{ model: string }>;
}) {
  const { model } = await params;
  const phone = getPhone(model);
  if (!phone) notFound();

  const m = phone.metrics;
  const priceGap = phone.releasePriceKRW - m.latestResale;

  const faq = [
    {
      q: `${phone.name}, 자급제와 통신사 중 뭐가 이득인가요?`,
      a: `케이스에 따라 다릅니다. ${phone.buyRoutes.subsidyNote} 원칙은 하나입니다: 월 요금 × 약정 개월 + 기기값의 2년 총비용으로만 비교하세요.`,
    },
    {
      q: `${phone.name} 중고로 사도 될까요?`,
      a: `현 중고 시세(A급 기준)는 ${formatManwon(m.latestResale)}로 출시가 대비 ${formatPct(m.residualPct, 0)} 수준입니다. ${phone.buyRoutes.mvnoNote}`,
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
            { name: "구매 루트", path: `/phones/${phone.slug}/buy` },
          ]),
        ]}
      />
      <DocShell
        phone={phone}
        docKey="buy"
        title={`${phone.name} 구매 루트`}
        lede="폰덱스는 실시간 최저가를 표시하지 않습니다. 대신 어느 루트로 사는 게 구조적으로 유리한지와, 각 루트의 함정을 정리합니다."
        asOf={phone.buyRoutes.asOf}
      >
        {/* 가격 컨텍스트 */}
        <section
          aria-label="가격 컨텍스트"
          className="rounded-xl border border-hairline bg-card p-5 shadow-card"
        >
          <h2 className="text-base font-bold">지금 가격 감각</h2>
          <p className="mt-2 text-sm leading-6 text-sub">
            출시가 {formatManwon(phone.releasePriceKRW)} ({phone.storageBase})
            · 현 중고 A급 시세 {formatManwon(m.latestResale)} — 신품과 중고의
            간격이 {formatManwon(priceGap)}입니다.{" "}
            {m.residualPct < 40
              ? "감가가 많이 진행된 기종이라 중고 구매의 가성비가 좋은 구간입니다."
              : m.residualPct > 55
                ? "감가 방어가 좋은 기종이라 신품을 사서 오래 쓰거나 되파는 전략이 유효합니다."
                : "신품·중고 어느 쪽도 무난한 구간입니다. 남은 보안지원 기간을 함께 고려하세요."}
          </p>
        </section>

        {/* 루트 3종 */}
        <section aria-label="구매 루트" className="grid gap-4 lg:grid-cols-3">
          <div className="flex flex-col rounded-xl border border-hairline bg-card p-5 shadow-card">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold">자급제</h2>
              <Badge tone="accent">통신사 무관</Badge>
            </div>
            <p className="mt-2 flex-1 text-sm leading-6 text-sub">
              공기계를 사서 원하는 요금제에 끼우는 방식. 약정·부가서비스 강제가
              없어 총비용 계산이 투명합니다.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {phone.buyRoutes.coupangUrl && (
                <a
                  href={phone.buyRoutes.coupangUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow sponsored"
                  className="rounded-lg bg-accent px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
                >
                  쿠팡에서 시세 보기
                </a>
              )}
              {phone.buyRoutes.danawaUrl && (
                <a
                  href={phone.buyRoutes.danawaUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="rounded-lg border border-hairline px-4 py-2 text-center text-sm font-semibold text-sub transition-colors hover:border-accent-strong/40 hover:text-accent"
                >
                  다나와 가격비교
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-col rounded-xl border border-hairline bg-card p-5 shadow-card">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold">통신사 (지원금)</h2>
              <Badge tone="warn">약정 조건 확인</Badge>
            </div>
            <p className="mt-2 flex-1 text-sm leading-6 text-sub">
              {phone.buyRoutes.subsidyNote}
            </p>
            <a
              href="https://www.smartchoice.or.kr"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-4 rounded-lg border border-hairline px-4 py-2 text-center text-sm font-semibold text-sub transition-colors hover:border-accent-strong/40 hover:text-accent"
            >
              스마트초이스 지원금 조회
            </a>
          </div>

          <div className="flex flex-col rounded-xl border border-hairline bg-card p-5 shadow-card">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold">중고 + 알뜰폰</h2>
              <Badge tone="good">총비용 최소</Badge>
            </div>
            <p className="mt-2 flex-1 text-sm leading-6 text-sub">
              {phone.buyRoutes.mvnoNote}
            </p>
            <a
              href="https://www.moyoplan.com"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-4 rounded-lg border border-hairline px-4 py-2 text-center text-sm font-semibold text-sub transition-colors hover:border-accent-strong/40 hover:text-accent"
            >
              모요 요금제 비교
            </a>
          </div>
        </section>

        <p className="rounded-lg bg-wash px-4 py-3 text-xs leading-5 text-mut">
          위 쿠팡 링크는 제휴 링크가 될 수 있으며, 구매 시 사이트에 수수료가
          지급될 수 있습니다. 링크 여부와 무관하게 내용은 동일한 기준으로
          작성됩니다.
        </p>

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
