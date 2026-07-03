/** 1155000 → "1,155,000원" */
export function formatKRW(n: number): string {
  return `${n.toLocaleString("ko-KR")}원`;
}

/** 1155000 → "115.5만원", 640000 → "64만원" */
export function formatManwon(n: number): string {
  const man = n / 10000;
  const rounded = Math.round(man * 10) / 10;
  const text = Number.isInteger(rounded)
    ? rounded.toLocaleString("ko-KR")
    : rounded.toFixed(1);
  return `${text}만원`;
}

/** 차트 눈금용: 640000 → "64만" */
export function formatManTick(n: number): string {
  return `${Math.round(n / 10000).toLocaleString("ko-KR")}만`;
}

/** "2025-02-07" → "2025.02" */
export function formatYearMonth(iso: string): string {
  const [y, m] = iso.split("-");
  return `${y}.${m}`;
}

/** "2025-02-07" → "2025년 2월" */
export function formatKoreanYearMonth(iso: string): string {
  const [y, m] = iso.split("-");
  return `${y}년 ${Number(m)}월`;
}

/** 오늘 기준 D-day 문자열. 과거면 "종료" */
export function formatDday(iso: string, now = new Date()): string {
  const target = new Date(iso);
  const days = Math.ceil(
    (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (days < 0) return "종료됨";
  if (days === 0) return "D-DAY";
  return `D-${days.toLocaleString("ko-KR")}`;
}

/** 남은 개월 수 (음수 = 지남) */
export function monthsBetween(fromDate: Date, toIso: string): number {
  const to = new Date(toIso);
  return (
    (to.getFullYear() - fromDate.getFullYear()) * 12 +
    (to.getMonth() - fromDate.getMonth())
  );
}

/** 31 → "2년 7개월" */
export function formatMonthsAsYears(months: number): string {
  if (months <= 0) return "0개월";
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m}개월`;
  if (m === 0) return `${y}년`;
  return `${y}년 ${m}개월`;
}

/** 47.8123 → "47.8%" */
export function formatPct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}
