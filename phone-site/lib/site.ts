export const SITE_NAME = "폰덱스";
export const SITE_NAME_EN = "Phondex";
export const SITE_TAGLINE = "휴대폰 결정 사전";
export const SITE_DESCRIPTION =
  "이 폰, 사도 될까? 기종별 업데이트 종료일·공식 수리비·알려진 이슈·구매 루트·중고 잔존가치부터 총소유비용·판매 타이밍까지 — 폰에 대한 모든 결정을 데이터로.";

// 배포 도메인. Vercel 환경변수 NEXT_PUBLIC_SITE_URL 로 덮어쓸 수 있음.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://qtree.kr";

// 연락처 — 필요 시 전용 주소로 교체
export const CONTACT_EMAIL = "qtree.comp@gmail.com";

// 분석·광고·검색엔진 인증 — Vercel 환경변수로 주입 (없으면 미삽입)
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID; // 예: G-XXXXXXXXXX
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT; // 예: ca-pub-2643737170468374
export const GSC_VERIFICATION = process.env.NEXT_PUBLIC_GSC_VERIFICATION; // Search Console HTML 태그 방식 토큰
export const NAVER_VERIFICATION = process.env.NEXT_PUBLIC_NAVER_VERIFICATION; // 네이버 서치어드바이저 토큰

/** 푸터 하단 법적/정보 링크 */
export const INFO_LINKS = [
  { href: "/about", label: "소개" },
  { href: "/methodology", label: "데이터 방법론" },
  { href: "/guide", label: "가이드" },
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/contact", label: "문의" },
] as const;

export const NAV_ITEMS = [
  { href: "/phones", label: "기종 목록" },
  { href: "/finder", label: "폰 찾기" },
  { href: "/best", label: "랭킹" },
  { href: "/compare", label: "기종 비교" },
  { href: "/price-check", label: "적정가 판독" },
  { href: "/calendar", label: "지원종료 캘린더" },
  { href: "/repair-cost", label: "수리비 비교" },
  { href: "/issues", label: "이슈 센터" },
  { href: "/guide", label: "가이드" },
  { href: "/my", label: "내 폰" },
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
  {
    key: "tco",
    label: "총소유비용",
    question: "월 얼마에 쓰는 셈인가?",
    icon: "coin",
  },
  {
    key: "care",
    label: "케어 유불리",
    question: "보험 들면 이득인가?",
    icon: "shield",
  },
  {
    key: "sell",
    label: "판매 타이밍",
    question: "언제·어디에 파는 게 최선?",
    icon: "tag",
  },
] as const;

export type DocTypeKey = (typeof DOC_TYPES)[number]["key"];

/**
 * 검색 색인에서 제외하는 문서 유형 — 중복성 높은 계산기·링크 페이지.
 * 사용자는 메인 기종 페이지에서 계속 접근 가능. sitemap 제외 + 각 페이지 robots:{index:false} 와 일치.
 * (used-check 은 DOC_TYPES 밖이라 sitemap 에서 별도로 이미 제외됨)
 */
export const NOINDEX_DOC_KEYS: DocTypeKey[] = ["buy", "tco", "care", "sell"];

/** 홈·허브에서 노출하는 인터랙티브 도구 목록 */
export const TOOLS = [
  {
    href: "/finder",
    label: "폰 추천 마법사",
    desc: "예산·용도 5문항으로 지금 사도 되는 기종 3개를 추립니다.",
    icon: "compass",
  },
  {
    href: "/price-check",
    label: "중고 적정가 판독기",
    desc: "매물 가격이 적정가인지, 급처인지, 바가지인지 판독합니다.",
    icon: "search",
  },
  {
    href: "/my",
    label: "내 폰 대시보드",
    desc: "내 기기의 남은 수명·현 시세·이슈를 한 화면에서 추적합니다.",
    icon: "user",
  },
  {
    href: "/best",
    label: "결정 랭킹",
    desc: "잔존가치·지원기간·수리비 부담·예산별 최강 기종 랭킹.",
    icon: "trophy",
  },
] as const;
