export const SITE_NAME = "폰덱스";
export const SITE_NAME_EN = "Phondex";
export const SITE_TAGLINE = "휴대폰 결정 사전";
export const SITE_DESCRIPTION =
  "이 폰, 사도 될까? 기종별 업데이트 종료일·공식 수리비·알려진 이슈·구매 루트·중고 잔존가치를 한 페이지에서 확인하세요.";

// 배포 시 실제 도메인으로 교체
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://phondex.example.com";

export const NAV_ITEMS = [
  { href: "/phones", label: "기종 목록" },
  { href: "/calendar", label: "지원종료 캘린더" },
  { href: "/repair-cost", label: "수리비 비교" },
  { href: "/compare", label: "기종 비교" },
] as const;

export const DOC_TYPES = [
  {
    key: "updates",
    label: "업데이트 종료",
    question: "몇 년 더 쓸 수 있나?",
    icon: "calendar",
  },
  {
    key: "repair",
    label: "공식 수리비",
    question: "고장 나면 얼마 드나?",
    icon: "wrench",
  },
  {
    key: "issues",
    label: "알려진 이슈",
    question: "이 기종 특유의 문제는?",
    icon: "alert",
  },
  {
    key: "buy",
    label: "구매 루트",
    question: "지금 어디서 사는 게 최선?",
    icon: "cart",
  },
  {
    key: "resale",
    label: "잔존가치",
    question: "3년 뒤 얼마 남나?",
    icon: "chart",
  },
] as const;

export type DocTypeKey = (typeof DOC_TYPES)[number]["key"];
