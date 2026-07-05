import type { PhoneWithMetrics } from "./phones";
import { getAllPhones } from "./phones";

/** 시리즈 허브 메타 — 데이터의 series 값과 1:1 매핑 */
export interface SeriesMeta {
  slug: string;
  name: string;
  brand: "samsung" | "apple";
  lede: string;
  cycleNote: string;
}

export const SERIES_LIST: SeriesMeta[] = [
  {
    slug: "galaxy-s",
    name: "갤럭시 S",
    brand: "samsung",
    lede: "삼성 플래그십. S24부터 보안 업데이트 7년 정책이 적용되어 오래 쓰기에 유리해졌습니다.",
    cycleNote: "신형 발표 통상 1~2월",
  },
  {
    slug: "galaxy-z",
    name: "갤럭시 Z",
    brand: "samsung",
    lede: "폴더블 라인. 힌지·내부 화면 내구성과 수리비가 결정의 핵심 변수입니다.",
    cycleNote: "신형 발표 통상 7월",
  },
  {
    slug: "galaxy-a",
    name: "갤럭시 A",
    brand: "samsung",
    lede: "중저가 실속 라인. 출고가가 낮아 수리비 부담률과 지원 기간을 더 꼼꼼히 봐야 합니다.",
    cycleNote: "주력 신형 출시 통상 3월",
  },
  {
    slug: "galaxy-note",
    name: "갤럭시 노트",
    brand: "samsung",
    lede: "단종된 라인 — S 울트라 시리즈로 계승됐습니다. 남은 지원 기간 확인이 최우선입니다.",
    cycleNote: "단종 (2021년 이후 신형 없음)",
  },
  {
    slug: "iphone",
    name: "아이폰",
    brand: "apple",
    lede: "잔존가치 방어가 강한 라인. 공식 지원 종료일을 사전 고지하지 않아 폰덱스는 역대 패턴 기반 추정치를 함께 표기합니다.",
    cycleNote: "신형 발표 통상 9월",
  },
];

const SERIES_NAME_TO_SLUG: Record<string, string> = Object.fromEntries(
  SERIES_LIST.map((s) => [s.name, s.slug]),
);

export function seriesSlugOf(p: PhoneWithMetrics): string | null {
  return SERIES_NAME_TO_SLUG[p.series] ?? null;
}

export function getSeries(slug: string): SeriesMeta | undefined {
  return SERIES_LIST.find((s) => s.slug === slug);
}

export function phonesOfSeries(slug: string): PhoneWithMetrics[] {
  const meta = getSeries(slug);
  if (!meta) return [];
  return getAllPhones().filter((p) => p.series === meta.name);
}
