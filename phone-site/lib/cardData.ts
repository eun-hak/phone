import {
  BRAND_LABELS,
  EOL_STATUS_META,
  type PhoneWithMetrics,
} from "./phones";
import {
  formatDday,
  formatManwon,
  formatPct,
  formatYearMonth,
} from "./format";
import type { PhoneCardData } from "@/components/phone/PhoneCard";

/** 서버 데이터 → 클라이언트 카드용 직렬화 뷰모델 */
export function toCardData(p: PhoneWithMetrics): PhoneCardData {
  const eolMeta = p.metrics.eolStatus
    ? EOL_STATUS_META[p.metrics.eolStatus]
    : null;
  return {
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    brandLabel: BRAND_LABELS[p.brand],
    releaseYm: formatYearMonth(p.releaseDate),
    releasePriceShort: formatManwon(p.releasePriceKRW),
    latestResaleShort: formatManwon(p.metrics.latestResale),
    residualPctText: formatPct(p.metrics.residualPct, 0),
    residualPct: p.metrics.residualPct,
    eolLabel: eolMeta?.label ?? "미상",
    eolTone: eolMeta?.tone ?? "neutral",
    ddayText: p.eol.securityEndDate
      ? formatDday(p.eol.securityEndDate)
      : "미상",
    displayRepairShort:
      p.metrics.displayRepairKRW !== null
        ? formatManwon(p.metrics.displayRepairKRW)
        : null,
    releaseDate: p.releaseDate,
    monthsLeft: p.metrics.monthsLeftSecurity,
    latestResale: p.metrics.latestResale,
  };
}
