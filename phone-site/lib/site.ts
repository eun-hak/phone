export const SITE_NAME = "폰덱스";
export const SITE_NAME_EN = "Phondex";
export const SITE_TAGLINE = "휴대폰 결정 사전";
export const SITE_DESCRIPTION =
  "이 폰, 사도 될까? 기종별 업데이트 종료일·공식 수리비·알려진 이슈·구매 루트·중고 잔존가치부터 총소유비용·판매 타이밍까지 — 폰에 대한 모든 결정을 데이터로.";

// 배포 도메인. qtree.kr 에서 이전했고, 옛 환경변수가 남아 덮어쓰는 사고를 막으려 코드에 고정한다.
export const SITE_URL = "https://phondex.plentyer.com";

// 연락처 — 필요 시 전용 주소로 교체
export const CONTACT_EMAIL = "qtree.comp@gmail.com";

// 분석·광고·검색엔진 인증 — Vercel 환경변수로 주입 (없으면 미삽입)
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID; // 예: G-XXXXXXXXXX
// 애드센스 — plentyer.com 퍼블리셔 계정(루트 ads.txt 와 일치해야 서브도메인에 광고가 나간다).
// 공개값이고, 옛 환경변수가 남아 덮어쓰는 사고를 막으려 코드에 고정한다.
export const ADSENSE_CLIENT = "ca-pub-1410200096892996";
// 검색엔진 소유 확인 토큰 — 페이지 소스에 노출되는 공개값이라 코드에 둔다.
export const GSC_VERIFICATION = "nGLC6wqeingyxdWpDtTR9DKlBw7TNDT9A8_l8PrHWt0"; // Google Search Console
export const NAVER_VERIFICATION = "5f0e3dd91ce9c220093f06d47127be51266f2a68"; // 네이버 서치어드바이저
export const BING_VERIFICATION = "112BB0292D8A2BCD2A6CA3E7C8C100B4"; // Bing Webmaster

/** Google Tag Manager 컨테이너 */
export const GTM_ID = "GTM-T53ST4GG";
/** 네이버 애널리틱스(wcslog) 계정 */
export const NAVER_WA = "1e0110f973f4190";

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
