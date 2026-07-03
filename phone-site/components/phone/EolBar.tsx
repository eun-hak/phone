import { formatDday, formatYearMonth } from "@/lib/format";

/** 출시 → 오늘 → 보안지원 종료를 한 눈에 보는 수명 진행 바 */
export default function EolBar({
  releaseDate,
  securityEndDate,
  elapsedPct,
}: {
  releaseDate: string;
  securityEndDate: string;
  elapsedPct: number;
}) {
  const pct = Math.round(elapsedPct);
  return (
    <div>
      <div
        role="img"
        aria-label={`전체 지원 기간 중 ${pct}% 경과`}
        className="relative h-2 overflow-hidden rounded-full bg-accent-soft"
      >
        <div
          className="h-full rounded-full bg-accent-strong"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex items-baseline justify-between text-xs text-mut">
        <span>출시 {formatYearMonth(releaseDate)}</span>
        <span className="font-medium text-sub">
          {pct}% 경과 · 종료까지 {formatDday(securityEndDate)}
        </span>
        <span>종료 {formatYearMonth(securityEndDate)}</span>
      </div>
    </div>
  );
}
