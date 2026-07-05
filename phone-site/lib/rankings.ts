import type { PhoneWithMetrics } from "./phones";
import { formatManwon, formatMonthsAsYears, formatPct } from "./format";
import { decisionScore } from "./insights";

/**
 * 랭킹 허브(/best) 정의 — 전부 기존 지표의 정렬·필터 뷰.
 * 새 랭킹은 여기에만 추가하면 목록·상세·사이트맵에 자동 반영된다.
 */

export interface RankedRow {
  phone: PhoneWithMetrics;
  valueText: string;
  subText?: string;
  /** 0~100, 막대 폭 (없으면 막대 생략) */
  barPct?: number;
}

export interface RankingDef {
  slug: string;
  title: string;
  shortTitle: string;
  question: string;
  description: string;
  /** 표 값 컬럼 헤더 */
  valueLabel: string;
  methodology: string;
  limit: number;
  build: (phones: PhoneWithMetrics[]) => RankedRow[];
}

const byDesc = (f: (p: PhoneWithMetrics) => number) =>
  (a: PhoneWithMetrics, b: PhoneWithMetrics) => f(b) - f(a);
const byAsc = (f: (p: PhoneWithMetrics) => number) =>
  (a: PhoneWithMetrics, b: PhoneWithMetrics) => f(a) - f(b);

function scoreRows(phones: PhoneWithMetrics[], limit: number): RankedRow[] {
  return phones
    .map((p) => ({ p, score: decisionScore(p) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ p, score }) => ({
      phone: p,
      valueText: `${score}점`,
      subText: `잔존가치 ${formatPct(p.metrics.residualPct, 0)} · 지원 ${
        p.metrics.monthsLeftSecurity !== null
          ? formatMonthsAsYears(Math.max(0, p.metrics.monthsLeftSecurity))
          : "미상"
      } 남음`,
      barPct: score,
    }));
}

function budgetRanking(slug: string, manwon: number): RankingDef {
  return {
    slug,
    title: `${manwon}만원 이하 최강 기종`,
    shortTitle: `예산 ${manwon}만원`,
    question: `${manwon}만원으로 뭘 사는 게 최선일까?`,
    description: `중고 A급 시세 ${manwon}만원 이하 기종을 종합 결정 점수(보안지원·잔존가치·수리비·이슈)로 줄 세운 랭킹입니다.`,
    valueLabel: "결정 점수",
    methodology:
      "종합 결정 점수 = 보안지원 잔여(40) + 잔존가치(25) + 수리비 부담(20) + 이슈(15). 중고 A급 개인거래 시세 기준.",
    limit: 10,
    build: (phones) =>
      scoreRows(
        phones.filter((p) => p.metrics.latestResale <= manwon * 10000),
        10,
      ),
  };
}

export const RANKINGS: RankingDef[] = [
  {
    slug: "overall",
    title: "종합 결정 점수 TOP 20",
    shortTitle: "종합 랭킹",
    question: "지금 사기에 가장 탄탄한 폰은?",
    description:
      "보안지원 잔여 기간, 잔존가치, 수리비 부담, 알려진 이슈를 하나의 점수로 합산한 폰덱스 종합 랭킹입니다.",
    valueLabel: "결정 점수",
    methodology:
      "종합 결정 점수 = 보안지원 잔여(40) + 잔존가치(25) + 수리비 부담(20) + 이슈(15), 100점 만점.",
    limit: 20,
    build: (phones) => scoreRows(phones, 20),
  },
  {
    slug: "residual-value",
    title: "잔존가치 방어 랭킹",
    shortTitle: "잔존가치",
    question: "되팔 때 손해가 가장 적은 폰은?",
    description:
      "출시가 대비 현 중고 시세(A급 중앙값) 비율이 높은 순서입니다. 감가 방어가 좋은 기종은 신품 구매의 실부담이 줄어듭니다.",
    valueLabel: "잔존가치",
    methodology: "잔존가치 = 현 A급 중고 시세 ÷ 출시가 × 100.",
    limit: 15,
    build: (phones) =>
      [...phones]
        .sort(byDesc((p) => p.metrics.residualPct))
        .slice(0, 15)
        .map((p) => ({
          phone: p,
          valueText: formatPct(p.metrics.residualPct, 0),
          subText: `출시가 ${formatManwon(p.releasePriceKRW)} → 현 시세 ${formatManwon(p.metrics.latestResale)}`,
          barPct: Math.min(100, p.metrics.residualPct),
        })),
  },
  {
    slug: "longest-support",
    title: "보안지원 오래 남은 랭킹",
    shortTitle: "지원기간",
    question: "가장 오래 안전하게 쓸 수 있는 폰은?",
    description:
      "보안 업데이트 종료까지 남은 기간이 긴 순서입니다. 4년 이상 쓸 계획이라면 이 랭킹이 가장 중요합니다.",
    valueLabel: "남은 지원",
    methodology:
      "제조사 공식 지원 정책(삼성 최대 7년, 애플 통상 6년+ 추정) 기준. '추정' 표기는 공식 발표 전 정책 기반 계산.",
    limit: 15,
    build: (phones) =>
      phones
        .filter((p) => p.metrics.monthsLeftSecurity !== null)
        .sort(byDesc((p) => p.metrics.monthsLeftSecurity ?? 0))
        .slice(0, 15)
        .map((p) => ({
          phone: p,
          valueText: formatMonthsAsYears(
            Math.max(0, p.metrics.monthsLeftSecurity ?? 0),
          ),
          subText: `${p.eol.securityEndDate?.slice(0, 7).replace("-", ".")}까지${p.eol.estimated ? " (추정)" : ""}`,
          barPct: Math.min(
            100,
            ((p.metrics.monthsLeftSecurity ?? 0) / 84) * 100,
          ),
        })),
  },
  {
    slug: "low-repair-burden",
    title: "수리비 부담 낮은 랭킹",
    shortTitle: "수리비 부담",
    question: "떨어뜨려도 지갑이 덜 아픈 폰은?",
    description:
      "화면 수리비 ÷ 현 중고 시세(수리비 부담률)가 낮은 순서입니다. 부담률이 100%를 넘으면 수리보다 중고 재구매가 쌉니다.",
    valueLabel: "부담률",
    methodology:
      "수리비 부담률 = 공식 화면 수리비 ÷ 현 A급 중고 시세 × 100. 케어 미가입 기준.",
    limit: 15,
    build: (phones) =>
      phones
        .filter((p) => p.metrics.repairBurdenPct !== null)
        .sort(byAsc((p) => p.metrics.repairBurdenPct ?? 0))
        .slice(0, 15)
        .map((p) => ({
          phone: p,
          valueText: formatPct(p.metrics.repairBurdenPct ?? 0, 0),
          subText: `화면 ${formatManwon(p.metrics.displayRepairKRW ?? 0)} · 시세 ${formatManwon(p.metrics.latestResale)}`,
          barPct: Math.min(100, p.metrics.repairBurdenPct ?? 0),
        })),
  },
  {
    slug: "support-per-manwon",
    title: "남은 수명 가성비 랭킹",
    shortTitle: "수명 가성비",
    question: "1만원당 안전한 사용 기간이 가장 긴 폰은?",
    description:
      "현 중고가 1만원당 남은 보안지원 일수로 계산한 '수명 가성비'입니다. 저렴한데 오래 지원되는 실속 기종이 상위에 옵니다.",
    valueLabel: "만원당 지원일",
    methodology:
      "만원당 지원일 = 남은 보안지원 일수 ÷ (현 A급 시세 ÷ 10,000). 지원 12개월 미만 기종은 제외.",
    limit: 15,
    build: (phones) =>
      phones
        .filter(
          (p) =>
            p.metrics.monthsLeftSecurity !== null &&
            p.metrics.monthsLeftSecurity >= 12,
        )
        .map((p) => ({
          p,
          v:
            ((p.metrics.monthsLeftSecurity ?? 0) * 30.4) /
            (p.metrics.latestResale / 10000),
        }))
        .sort((a, b) => b.v - a.v)
        .slice(0, 15)
        .map(({ p, v }) => ({
          phone: p,
          valueText: `${v.toFixed(1)}일`,
          subText: `시세 ${formatManwon(p.metrics.latestResale)} · 지원 ${formatMonthsAsYears(Math.max(0, p.metrics.monthsLeftSecurity ?? 0))} 남음`,
          barPct: Math.min(100, (v / 40) * 100),
        })),
  },
  budgetRanking("under-30", 30),
  budgetRanking("under-50", 50),
  budgetRanking("under-80", 80),
  {
    slug: "avoid-now",
    title: "지금 사면 안 되는 기종",
    shortTitle: "비추천 목록",
    question: "싸다고 잡으면 후회하는 폰은?",
    description:
      "보안지원이 이미 종료됐거나 1년 미만 남은 기종입니다. 금융앱 등 보안 민감 용도로는 권장하지 않으며, 중고가가 싸 보여도 실사용 수명이 짧습니다.",
    valueLabel: "지원 상태",
    methodology:
      "보안 업데이트 종료(또는 12개월 미만) 기준. 서브폰·공기계 용도라면 무방합니다.",
    limit: 20,
    build: (phones) =>
      phones
        .filter(
          (p) =>
            p.metrics.eolStatus === "ended" ||
            p.metrics.eolStatus === "urgent",
        )
        .sort(byAsc((p) => p.metrics.monthsLeftSecurity ?? -999))
        .slice(0, 20)
        .map((p) => ({
          phone: p,
          valueText:
            p.metrics.eolStatus === "ended"
              ? "지원 종료"
              : `${formatMonthsAsYears(Math.max(0, p.metrics.monthsLeftSecurity ?? 0))} 남음`,
          subText: `현 시세 ${formatManwon(p.metrics.latestResale)}`,
        })),
  },
];

export function getRanking(slug: string): RankingDef | undefined {
  return RANKINGS.find((r) => r.slug === slug);
}
