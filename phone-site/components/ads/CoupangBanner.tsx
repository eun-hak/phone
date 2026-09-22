"use client";

import { useEffect, useRef } from "react";
import { COUPANG } from "@/lib/site";

type PartnersWindow = Window & {
  PartnersCoupang?: { G: new (opts: Record<string, unknown>) => unknown };
  __coupangGjs?: Promise<void>;
};

/** 쿠팡 공식 g.js 를 페이지당 한 번만 불러온다 */
function loadGjs(): Promise<void> {
  const w = window as PartnersWindow;
  if (w.PartnersCoupang) return Promise.resolve();
  if (!w.__coupangGjs) {
    w.__coupangGjs = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://ads-partners.coupang.com/g.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("coupang g.js load failed"));
      document.head.appendChild(s);
    });
  }
  return w.__coupangGjs;
}

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
  const ref = useRef<HTMLDivElement>(null);
  const banner = COUPANG.banner;

  useEffect(() => {
    const el = ref.current;
    if (!el || !banner) return;
    let cancelled = false;
    loadGjs()
      .then(() => {
        const G = (window as PartnersWindow).PartnersCoupang?.G;
        if (cancelled || !G || el.childElementCount > 0) return;
        new G({
          ...banner,
          trackingCode: COUPANG.trackingCode,
          tsource: "",
          container: el,
        });
      })
      .catch(() => {
        /* 광고 차단기 등으로 로드 실패 시 조용히 비워둔다 */
      });
    return () => {
      cancelled = true;
      el.innerHTML = "";
    };
  }, [banner]);

  if (!banner) return null;
  const label = (context && CONTEXT_LABEL[context]) ?? "관련 상품 둘러보기";

  return (
    <aside
      aria-label="쿠팡 파트너스 추천 상품"
      className="rounded-xl border border-hairline bg-card p-4 shadow-card"
    >
      <p className="text-[13px] font-medium leading-5 text-ink">
        {COUPANG.disclosure}
      </p>
      <p className="mt-2.5 text-xs font-semibold text-sub">{label}</p>
      {/* 배너 폭 680px 고정 — 모바일에선 좌우로 밀어서 본다 */}
      <div className="mt-2 overflow-x-auto">
        <div ref={ref} style={{ minHeight: Number(banner.height) }} />
      </div>
    </aside>
  );
}
