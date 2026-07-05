import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPhones, getPhone } from "@/lib/phones";
import {
  computeBatterySwap,
  computeSellRoutes,
  computeSellTiming,
} from "@/lib/insights";
import { formatKRW, formatManwon } from "@/lib/format";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/jsonld";
import DocShell from "@/components/phone/DocShell";
import StatTile from "@/components/ui/StatTile";
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
    title: `${phone.name} 언제·어디에 팔까 — 판매 타이밍과 처분 루트`,
    description: `${phone.name} 현 시세 ${formatManwon(phone.metrics.latestResale)} (A급 기준). 신형 발표 일정과 감가 속도로 판매 타이밍을, 개인거래·매입업체·보상판매 3루트의 실수령액을 비교합니다.`,
    alternates: { canonical: `/phones/${model}/sell` },
  };
}

const SELLER_CHECKLIST: Array<{
  text: string;
  detail: (brand: "samsung" | "apple") => string;
}> = [
  {
    text: "데이터 백업 후 계정 로그아웃",
    detail: (b) =>
      b === "apple"
        ? "iCloud 백업 → 설정에서 Apple 계정 로그아웃. '나의 찾기(Find My)'가 켜진 채 팔면 구매자가 못 쓰고, 분쟁이 됩니다."
        : "스마트스위치/구글 백업 → 삼성 계정·구글 계정 모두 로그아웃. 구글 FRP 잠금이 남으면 초기화해도 구매자가 못 씁니다.",
  },
  {
    text: "공장 초기화 + 유심/eSIM 제거",
    detail: () =>
      "초기화 전 계정 로그아웃이 먼저입니다(순서 바뀌면 활성화 잠금 잔존). eSIM은 회선 삭제까지 확인하세요.",
  },
  {
    text: "IMEI 메모 후 판매 기록 보관",
    detail: () =>
      "판매 후 명의도용·범죄 연루 분쟁에 대비해 IMEI, 거래 일시, 대화 내역을 보관하세요.",
  },
  {
    text: "구성품·박스 챙기기",
    detail: () =>
      "박스·미사용 케이블 포함 여부로 호가가 1~3만원 달라집니다. 있으면 사진에 반드시 노출하세요.",
  },
  {
    text: "판매글에 배터리 성능·수리 이력 명시",
    detail: (b) =>
      b === "apple"
        ? "배터리 최대 용량 스크린샷을 첨부하면 문의가 줄고 신뢰가 올라갑니다. 숨긴 하자는 환불 분쟁 사유가 됩니다."
        : "삼성 멤버스 진단 결과를 첨부하면 문의가 줄고 신뢰가 올라갑니다. 숨긴 하자는 환불 분쟁 사유가 됩니다.",
  },
];

export default async function SellPage({
  params,
}: {
  params: Promise<{ model: string }>;
}) {
  const { model } = await params;
  const phone = getPhone(model);
  if (!phone) notFound();

  const timing = computeSellTiming(phone);
  const routes = computeSellRoutes(phone);
  const battery = computeBatterySwap(phone);

  const faq = [
    {
      q: `${phone.name} 지금 파는 게 나을까요?`,
      a: timing.advice.join(" "),
    },
    {
      q: "어디에 파는 게 제일 이득인가요?",
      a: `실수령액은 통상 개인거래 > 매입업체 > 보상판매 순입니다. 다만 개인거래는 시간·사기 리스크 비용이 있어, 시세차가 10% 이내라면 매입업체의 즉시 현금화가 합리적일 수 있습니다.`,
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
            { name: "판매 타이밍", path: `/phones/${phone.slug}/sell` },
          ]),
        ]}
      />
      <DocShell
        phone={phone}
        docKey="sell"
        title={`${phone.name} 언제 · 어디에 팔까`}
        lede="판매의 두 가지 결정 — 타이밍(언제)과 루트(어디에)를 시세 데이터와 신형 출시 주기로 판단합니다."
        asOf={timing.asOf}
      >
        {/* 타이밍 요약 */}
        <section
          aria-label="판매 타이밍 요약"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatTile
            label="지금 팔면 (A급 개인거래)"
            value={formatManwon(timing.nowKRW)}
            sub={`기준일 ${timing.asOf}`}
          />
          {timing.projections.map((pr) => (
            <StatTile
              key={pr.monthsAhead}
              label={`${pr.monthsAhead}개월 뒤 예상`}
              value={pr.priceKRW != null ? formatManwon(pr.priceKRW) : "—"}
              sub={
                pr.lossKRW != null && pr.lossKRW > 0
                  ? `지금보다 −${formatManwon(pr.lossKRW)} (추정)`
                  : "추정 불가 (기록 부족)"
              }
            />
          ))}
        </section>

        {/* 타이밍 판단 */}
        <section aria-label="타이밍 판단">
          <h2 className="text-lg font-bold tracking-tight">타이밍 판단</h2>
          <div className="mt-4 rounded-xl border border-hairline bg-card p-5 shadow-card">
            {timing.nextLaunchLabel && timing.monthsToLaunch !== null && (
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={timing.monthsToLaunch <= 3 ? "warn" : "neutral"} dot>
                  {timing.nextLaunchLabel}
                </Badge>
                <span className="text-xs text-sub">
                  {timing.monthsToLaunch === 0
                    ? "이번 달"
                    : `약 ${timing.monthsToLaunch}개월 뒤`}
                </span>
              </div>
            )}
            <ul className="mt-3 space-y-2">
              {timing.advice.map((a) => (
                <li key={a} className="flex gap-2 text-sm leading-6 text-ink">
                  <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-sub" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 처분 루트 비교 */}
        <section aria-label="처분 루트 비교">
          <h2 className="text-lg font-bold tracking-tight">
            처분 루트 3가지 — 실수령액 비교
          </h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {routes.map((r) => (
              <div
                key={r.key}
                className="flex flex-col rounded-xl border border-hairline bg-card p-5 shadow-card"
              >
                <p className="text-sm font-bold">{r.label}</p>
                <p className="tnum mt-2 text-2xl font-bold tracking-tight">
                  {r.estimateKRW != null ? formatKRW(r.estimateKRW) : "고시가 확인"}
                </p>
                <p className="mt-1 text-xs leading-5 text-mut">
                  {r.estimateNote}
                </p>
                <dl className="mt-3 space-y-1.5 border-t border-hairline pt-3 text-xs leading-5">
                  <div className="flex gap-1.5">
                    <dt className="shrink-0 font-semibold text-good-deep">장점</dt>
                    <dd className="text-sub">{r.pros}</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="shrink-0 font-semibold text-serious">단점</dt>
                    <dd className="text-sub">{r.cons}</dd>
                  </div>
                </dl>
                {r.linkUrl && (
                  <a
                    href={r.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="mt-auto pt-3 text-xs font-medium text-accent hover:underline"
                  >
                    {r.linkLabel} ↗
                  </a>
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-mut">
            매입업체 추정가는 개인거래 시세 대비 통상 할인율(25~30%)을 적용한
            참고값입니다. 실제 매입가는 등급 판정에 따라 달라지므로 반드시
            업체 시세 조회로 확인하세요.
          </p>
        </section>

        {/* 팔까 말까 — 배터리 교체 대안 */}
        <section aria-label="팔지 말고 더 쓰는 선택지">
          <h2 className="text-lg font-bold tracking-tight">
            팔기 전에 — 배터리만 갈고 더 쓰는 건 어떨까?
          </h2>
          <div className="mt-4 rounded-xl border border-hairline bg-card p-5 shadow-card">
            <Badge tone={battery.tone} dot>
              {battery.label}
            </Badge>
            <ul className="mt-3 space-y-2">
              {battery.reasons.map((r) => (
                <li key={r} className="flex gap-2 text-sm leading-6 text-ink">
                  <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-sub" />
                  {r}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-mut">
              총소유비용 관점의 상세 계산은{" "}
              <Link
                href={`/phones/${phone.slug}/tco`}
                className="font-medium text-accent underline underline-offset-2"
              >
                TCO 문서
              </Link>
              에서 확인하세요.
            </p>
          </div>
        </section>

        {/* 판매 준비 체크리스트 */}
        <section aria-label="판매 준비 체크리스트">
          <h2 className="text-lg font-bold tracking-tight">
            판매 준비 체크리스트
          </h2>
          <p className="mt-1 text-sm text-sub">
            순서대로 진행하세요 — 특히 ①(계정 로그아웃)을 건너뛰고 초기화하면
            활성화 잠금이 남아 거래 분쟁이 됩니다.
          </p>
          <ol className="mt-4 space-y-3">
            {SELLER_CHECKLIST.map((item, i) => (
              <li
                key={item.text}
                className="flex gap-3.5 rounded-xl border border-hairline bg-card p-4 shadow-card"
              >
                <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold">{item.text}</p>
                  <p className="mt-1 text-xs leading-5 text-sub">
                    {item.detail(phone.brand)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
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
