import { COUPANG } from "@/lib/site";

/** 문서 성격별 안내 문구 — 검색해서 들어온 사람이 지금 고민하는 것에 맞춘다 */
const CONTEXT_LABEL: Record<string, string> = {
  repair: "수리비가 부담된다면 — 케이스·보호필름부터 새 기종까지",
  care: "파손이 걱정된다면 — 케이스·보호필름 둘러보기",
  updates: "지원 종료가 다가온다면 — 새 기종 가격 보기",
  issues: "고질 이슈가 신경 쓰인다면 — 다른 기종 가격 보기",
  resale: "갈아탈 계획이라면 — 새 기종 가격 보기",
  sell: "팔고 바꿀 계획이라면 — 새 기종 가격 보기",
  tco: "총비용을 비교했다면 — 지금 가격 확인하기",
  buy: "지금 가격 확인하기",
  "used-check": "중고로 샀다면 — 케이스·보호필름 챙기기",
};

export default function CoupangBanner({ context }: { context?: string }) {
  if (!COUPANG.bannerSrc) return null;
  const label = (context && CONTEXT_LABEL[context]) ?? "관련 상품 둘러보기";
  return (
    <aside
      aria-label="쿠팡 파트너스 추천 상품"
      className="rounded-xl border border-hairline bg-card p-4 shadow-card"
    >
      <p className="text-xs font-semibold text-mut">{label}</p>
      <div className="mt-3 overflow-hidden rounded-lg">
        <iframe
          src={COUPANG.bannerSrc}
          width="100%"
          height={COUPANG.bannerHeight}
          loading="lazy"
          referrerPolicy="unsafe-url"
          title="쿠팡 추천 상품"
          className="block w-full border-0"
        />
      </div>
      <p className="mt-2.5 text-[11px] leading-4 text-mut">
        {COUPANG.disclosure}
      </p>
    </aside>
  );
}
