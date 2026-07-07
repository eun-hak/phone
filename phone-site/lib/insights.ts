import type { PhoneWithMetrics } from "./phones";
import { formatManwon, formatPct } from "./format";

/**
 * 파생 인사이트 — TCO(총소유비용), 시세 프로젝션, 판매 타이밍,
 * 배터리 교체 판정, 적정가 범위, 종합 결정 점수.
 * 모두 기존 데이터(시세·수리비·지원종료)의 재조합이며 새 데이터를 요구하지 않는다.
 * (서버에서 계산, 직렬화 가능)
 */

const NOW = new Date();

function monthsBetweenIso(fromIso: string, toIso: string): number {
  const a = new Date(fromIso);
  const b = new Date(toIso);
  return (
    (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
  );
}

/* ─────────────────────────── 시세 프로젝션 ─────────────────────────── */

/**
 * 월평균 하락액(절대값) 선형 외삽. 바닥은 출시가의 7%
 * (구형도 부품·수집 가치로 0원이 되지는 않는 경험적 하한).
 *
 * 하락액 산정:
 *  - 시세 추적 포인트가 2개 이상이면 추적 구간의 월 하락액을 사용.
 *  - 1개뿐이면 출시가→현 시세의 '생애 평균 감가'로 대체(추적 데이터가
 *    쌓이기 전에도 계산 가능). 신형은 초기 감가가 가팔라 과대추정될 수
 *    있으므로 월 하락액을 현 시세의 2.5%로 상한(guard)한다.
 */
export function projectResale(
  p: PhoneWithMetrics,
  monthsAhead: number,
): number {
  const sorted = [...p.resale].sort((a, b) => a.date.localeCompare(b.date));
  const last = sorted[sorted.length - 1];

  let dropPerMonth: number;
  if (sorted.length >= 2) {
    const first = sorted[0];
    const span = Math.max(1, monthsBetweenIso(first.date, last.date));
    dropPerMonth = (first.priceKRW - last.priceKRW) / span;
  } else {
    const age = Math.max(1, monthsBetweenIso(p.releaseDate, last.date));
    dropPerMonth = (p.releasePriceKRW - last.priceKRW) / age;
  }
  // 음수(가치 상승) 방지 + 현 시세의 월 2.5% 초과 하락 방지
  dropPerMonth = Math.max(0, Math.min(dropPerMonth, last.priceKRW * 0.025));

  const floor = Math.round(p.releasePriceKRW * 0.07);
  return Math.max(
    floor,
    Math.round((last.priceKRW - dropPerMonth * monthsAhead) / 1000) * 1000,
  );
}

/* ─────────────────────────── TCO (총소유비용) ─────────────────────────── */

export interface TcoScenario {
  key: "used-now" | "new-now";
  label: string;
  /** 지금 사는 가격 */
  buyKRW: number;
  /** 보유 종료 시점 예상 매도가 (프로젝션 불가 시 null) */
  exitKRW: number | null;
  /** 순비용 = 구매가 − 예상 매도가 */
  netKRW: number | null;
  monthlyKRW: number | null;
  notes: string[];
}

export interface TcoData {
  horizonMonths: number;
  scenarios: TcoScenario[];
  /** 보유 기간이 보안지원 안에 들어오는가 (null = 종료일 미상) */
  supportCoversHorizon: boolean | null;
  /** 보유 중 배터리 1회 교체 가정 시 추가 비용 */
  batteryAddonKRW: number | null;
  assumptions: string[];
}

/** 기준 보유 기간(월)별 TCO. 신품 시나리오는 출시 15개월 이내만 제시. */
export function computeTco(
  p: PhoneWithMetrics,
  horizonMonths = 24,
): TcoData {
  const m = p.metrics;
  const exitUsed = projectResale(p, horizonMonths);
  const battery = p.repairCosts.find((r) => r.part === "battery");

  const scenarios: TcoScenario[] = [];

  {
    const buy = m.latestResale;
    const net = exitUsed !== null ? buy - exitUsed : null;
    scenarios.push({
      key: "used-now",
      label: `지금 중고(A급)로 사서 ${Math.round(horizonMonths / 12)}년`,
      buyKRW: buy,
      exitKRW: exitUsed,
      netKRW: net,
      monthlyKRW: net !== null ? Math.round(net / horizonMonths) : null,
      notes: [
        `구매가: 현 A급 시세 ${formatManwon(buy)} (기준일 ${m.latestResaleDate})`,
      ],
    });
  }

  const ageMonths = monthsBetweenIso(p.releaseDate, NOW.toISOString().slice(0, 10));
  if (ageMonths <= 15) {
    const buy = p.releasePriceKRW;
    const net = exitUsed !== null ? buy - exitUsed : null;
    scenarios.push({
      key: "new-now",
      label: `신품(출고가)으로 사서 ${Math.round(horizonMonths / 12)}년`,
      buyKRW: buy,
      exitKRW: exitUsed,
      netKRW: net,
      monthlyKRW: net !== null ? Math.round(net / horizonMonths) : null,
      notes: [
        "구매가: 출고가 기준 — 자급제 할인·카드 프로모션에 따라 실구매가는 더 낮을 수 있음",
      ],
    });
  }

  let supportCoversHorizon: boolean | null = null;
  if (m.monthsLeftSecurity !== null) {
    supportCoversHorizon = m.monthsLeftSecurity >= horizonMonths;
  }

  return {
    horizonMonths,
    scenarios,
    supportCoversHorizon,
    batteryAddonKRW: battery?.officialKRW ?? null,
    assumptions: [
      "매도가는 출시가 대비 현 시세의 평균 감가(시세 추적이 쌓이면 월별 하락액)를 월 2.5% 상한으로 선형 외삽한 추정치 (하한: 출시가의 7%)",
      "요금제·액세서리·보험은 제외한 기기값 기준",
      "중고 구매·매도 모두 상태 A급 개인거래 시세 기준",
    ],
  };
}

/* ─────────────────────────── 판매 타이밍 ─────────────────────────── */

const SERIES_LAUNCH: Record<string, { month: number; label: string } | null> = {
  "갤럭시 S": { month: 2, label: "갤럭시 S 신형 발표 (통상 1~2월)" },
  "갤럭시 Z": { month: 7, label: "갤럭시 Z 신형 발표 (통상 7월)" },
  "갤럭시 A": { month: 3, label: "갤럭시 A 주력 신형 출시 (통상 3월)" },
  "갤럭시 노트": null, // 단종 라인
  아이폰: { month: 9, label: "아이폰 신형 발표 (통상 9월)" },
};

export interface SellProjection {
  monthsAhead: number;
  priceKRW: number | null;
  lossKRW: number | null;
}

export interface SellTiming {
  nowKRW: number;
  asOf: string;
  nextLaunchLabel: string | null;
  monthsToLaunch: number | null;
  projections: SellProjection[];
  advice: string[];
}

export function computeSellTiming(p: PhoneWithMetrics): SellTiming {
  const m = p.metrics;
  const launch = SERIES_LAUNCH[p.series] ?? null;

  let monthsToLaunch: number | null = null;
  if (launch) {
    const nowMonth = NOW.getMonth() + 1;
    monthsToLaunch = (launch.month - nowMonth + 12) % 12;
  }

  const projections: SellProjection[] = [3, 6, 12].map((n) => {
    const price = projectResale(p, n);
    return {
      monthsAhead: n,
      priceKRW: price,
      lossKRW: price !== null ? m.latestResale - price : null,
    };
  });

  const advice: string[] = [];
  const sixMo = projections.find((x) => x.monthsAhead === 6);
  if (sixMo?.lossKRW != null && sixMo.lossKRW > 0) {
    advice.push(
      `지금 팔지 않고 6개월 보유하면 약 ${formatManwon(sixMo.lossKRW)}의 시세 하락이 예상됩니다 (추정).`,
    );
  }
  if (launch && monthsToLaunch !== null && monthsToLaunch <= 3) {
    advice.push(
      `${launch.label}가 ${monthsToLaunch === 0 ? "이번 달" : `약 ${monthsToLaunch}개월 뒤`}입니다. 신형 발표 후 구형 시세는 계단식으로 내려가는 경향이 있어, 갈아탈 계획이 확정이면 발표 전 처분이 유리합니다.`,
    );
  } else if (launch && monthsToLaunch !== null) {
    advice.push(
      `${launch.label}까지 약 ${monthsToLaunch}개월. 다음 신형 발표 전까지는 급격한 시세 변동 요인이 적습니다.`,
    );
  }
  if (m.avgMonthlyDropPct !== null && m.avgMonthlyDropPct >= 2.5) {
    advice.push(
      `이 기종은 감가가 빠른 구간입니다 (월평균 ${formatPct(m.avgMonthlyDropPct)} 하락). 처분 계획이 있다면 미룰수록 손해가 커집니다.`,
    );
  }
  if (m.eolStatus === "ended") {
    advice.push(
      "보안지원이 종료돼 시세 방어가 어렵습니다. 중고 수요가 남아 있을 때 처분하거나, 공기계(서브폰) 활용을 고려하세요.",
    );
  } else if (m.eolStatus === "urgent") {
    advice.push(
      "보안지원 종료가 1년 미만입니다. 종료 시점 이후 시세가 한 단계 더 내려가는 경향이 있습니다.",
    );
  }
  if (advice.length === 0) {
    advice.push(
      "시세 기록이 쌓이는 중입니다. 현재로서는 급하게 팔 이유도, 미룰 이유도 뚜렷하지 않습니다.",
    );
  }

  return {
    nowKRW: m.latestResale,
    asOf: m.latestResaleDate,
    nextLaunchLabel: launch?.label ?? null,
    monthsToLaunch,
    projections,
    advice,
  };
}

/* ─────────────────────────── 처분 루트 ─────────────────────────── */

export interface SellRoute {
  key: "p2p" | "buyback" | "trade-in";
  label: string;
  estimateKRW: number | null;
  estimateNote: string;
  pros: string;
  cons: string;
  linkLabel?: string;
  linkUrl?: string;
}

export function computeSellRoutes(p: PhoneWithMetrics): SellRoute[] {
  const now = p.metrics.latestResale;
  return [
    {
      key: "p2p",
      label: "개인거래 (번개장터·당근)",
      estimateKRW: now,
      estimateNote: `A급 중앙값 · 기준일 ${p.metrics.latestResaleDate}`,
      pros: "실수령액이 가장 큼",
      cons: "판매 소요 시간·직거래 품·사기 리스크 부담",
    },
    {
      key: "buyback",
      label: "매입업체 (민팃 등)",
      estimateKRW: Math.round((now * 0.72) / 1000) * 1000,
      estimateNote: "개인거래가 대비 약 25~30% 낮은 경향으로 추정한 값",
      pros: "즉시 현금화, 무인 ATM으로 간편",
      cons: "실수령액 손해 · 등급 판정이 짜게 나올 수 있음",
      linkLabel: "민팃 시세 조회",
      linkUrl: "https://www.mintit.co.kr/",
    },
    {
      key: "trade-in",
      label: "제조사 보상판매 (트레이드인)",
      estimateKRW: null,
      estimateNote: "신기기 구매 조건부 — 공식 페이지에서 기종별 고시가 확인",
      pros: "신기기 구매와 동시 처리, 추가 프로모션이 붙는 시즌 존재",
      cons: "신기기 구매 조건부라 단독 처분 불가",
      linkLabel:
        p.brand === "apple" ? "Apple Trade In 고시가" : "삼성 중고보상 고시가",
      linkUrl:
        p.brand === "apple"
          ? "https://www.apple.com/kr/shop/trade-in"
          : "https://www.samsung.com/sec/trade-in/",
    },
  ];
}

/* ─────────────────────────── 배터리 교체 vs 기기 교체 ─────────────────────────── */

export interface BatterySwapVerdict {
  label: string;
  tone: "good" | "warn" | "serious" | "crit";
  reasons: string[];
  batteryCostKRW: number | null;
}

export function computeBatterySwap(p: PhoneWithMetrics): BatterySwapVerdict {
  const m = p.metrics;
  const battery = p.repairCosts.find((r) => r.part === "battery");
  const cost = battery?.officialKRW ?? null;
  const reasons: string[] = [];

  if (cost !== null) {
    reasons.push(
      `공식 배터리 교체비 ${formatManwon(cost)} — 현 시세의 ${formatPct((cost / m.latestResale) * 100, 0)}`,
    );
  }

  if (m.eolStatus === "ended") {
    reasons.push(
      "보안지원이 이미 종료됨 — 배터리를 갈아도 소프트웨어 수명은 늘지 않음",
    );
    return { label: "교체보다 기기 변경 권장", tone: "crit", reasons, batteryCostKRW: cost };
  }

  if (m.monthsLeftSecurity !== null && cost !== null) {
    if (m.monthsLeftSecurity >= 24 && cost <= m.latestResale * 0.3) {
      reasons.push(
        `보안지원이 2년 이상 남아, 교체 비용을 충분히 회수할 수 있는 구간`,
      );
      return {
        label: "배터리만 교체하고 계속 쓰기 유리",
        tone: "good",
        reasons,
        batteryCostKRW: cost,
      };
    }
    if (m.monthsLeftSecurity >= 12) {
      reasons.push(
        "보안지원 잔여가 1~2년 — 그 기간만큼 더 쓸 계획이면 교체가 이득",
      );
      return {
        label: "1~2년 더 쓸 계획이면 교체",
        tone: "warn",
        reasons,
        batteryCostKRW: cost,
      };
    }
    reasons.push("보안지원 종료가 1년 미만 — 교체 비용 회수 기간이 짧음");
    return {
      label: "교체 실익 낮음 — 기변 시점 고민",
      tone: "serious",
      reasons,
      batteryCostKRW: cost,
    };
  }

  reasons.push("배터리 교체비 또는 지원종료일 데이터가 없어 일반 기준으로 판단");
  return {
    label: "케이스별 판단 필요",
    tone: "warn",
    reasons,
    batteryCostKRW: cost,
  };
}

/* ─────────────────────────── 적정가 범위 ─────────────────────────── */

export interface FairPriceBand {
  grade: "S" | "A" | "B";
  gradeLabel: string;
  loKRW: number;
  hiKRW: number;
}

export interface FairPrice {
  asOf: string;
  bands: FairPriceBand[];
  /** 배터리 성능 85% 미만이면 깎을 금액 */
  batteryPenaltyKRW: number | null;
}

const round1000 = (n: number) => Math.round(n / 1000) * 1000;

export function computeFairPrice(p: PhoneWithMetrics): FairPrice {
  const a = p.metrics.latestResale;
  const battery = p.repairCosts.find((r) => r.part === "battery");
  const sHi = Math.min(a * 1.2, p.releasePriceKRW * 0.95);
  return {
    asOf: p.metrics.latestResaleDate,
    bands: [
      {
        grade: "S",
        gradeLabel: "S급 (미개봉·개봉만)",
        loKRW: round1000(a * 1.08),
        hiKRW: round1000(Math.max(sHi, a * 1.1)),
      },
      {
        grade: "A",
        gradeLabel: "A급 (생활기스 없음·정상 작동)",
        loKRW: round1000(a * 0.92),
        hiKRW: round1000(a * 1.08),
      },
      {
        grade: "B",
        gradeLabel: "B급 (사용감·잔기스 있음)",
        loKRW: round1000(a * 0.75),
        hiKRW: round1000(a * 0.9),
      },
    ],
    batteryPenaltyKRW: battery ? battery.officialKRW : null,
  };
}

/* ─────────────────────────── 종합 결정 점수 ─────────────────────────── */

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

/**
 * 0~100. 보안지원 잔여(40) + 잔존가치(25) + 수리비 부담(20) + 이슈(15).
 * 랭킹·추천 마법사의 공통 기준. 가중치는 “오래 안전하게 + 되팔 때 손해 적게”.
 */
export function decisionScore(p: PhoneWithMetrics): number {
  const m = p.metrics;
  const support =
    m.monthsLeftSecurity === null
      ? 16 // 미상은 중간값보다 약간 낮게
      : (clamp(m.monthsLeftSecurity, 0, 84) / 84) * 40;
  const residual = (clamp(m.residualPct, 0, 100) / 100) * 25;
  const repair =
    m.repairBurdenPct === null
      ? 10
      : clamp(1 - m.repairBurdenPct / 100, 0, 1) * 20;
  const openCommon = p.issues.filter(
    (i) => i.severity === "common" && i.status === "open",
  ).length;
  const issue = clamp(15 - m.criticalOpenIssues * 12 - openCommon * 4, 0, 15);
  return Math.round((support + residual + repair + issue) * 10) / 10;
}
