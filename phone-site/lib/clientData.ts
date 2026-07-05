import type { PhoneWithMetrics } from "./phones";
import { BRAND_LABELS, EOL_STATUS_META } from "./phones";
import { decisionScore, projectResale, computeFairPrice } from "./insights";
import type { BadgeTone } from "@/components/ui/Badge";

/**
 * 클라이언트 도구(추천 마법사·적정가 판독기·내 폰 대시보드·비교 빌더)용
 * 직렬화 뷰모델. 서버에서 만들어 props로 내려보낸다.
 */

export interface ToolPhone {
  slug: string;
  name: string;
  brand: "samsung" | "apple";
  brandLabel: string;
  series: string;
  releaseDate: string;
  releasePriceKRW: number;
  displayInch: number;

  latestResale: number;
  latestResaleDate: string;
  prevResale: number | null;
  residualPct: number;

  monthsLeft: number | null;
  securityEndDate: string | null;
  eolEstimated: boolean;
  eolLabel: string;
  eolTone: BadgeTone;

  displayRepairKRW: number | null;
  batteryRepairKRW: number | null;
  repairBurdenPct: number | null;

  criticalOpenIssues: number;
  liveIssueTitles: string[];

  verdictLabel: string;
  verdictTone: BadgeTone;
  score: number;

  projected12moKRW: number | null;

  fairA_lo: number;
  fairA_hi: number;
  fairB_lo: number;
  fairB_hi: number;
  fairS_lo: number;
  fairS_hi: number;
}

export function toToolPhone(p: PhoneWithMetrics): ToolPhone {
  const m = p.metrics;
  const sorted = [...p.resale].sort((a, b) => a.date.localeCompare(b.date));
  const prev = sorted.length >= 2 ? sorted[sorted.length - 2].priceKRW : null;
  const eolMeta = m.eolStatus ? EOL_STATUS_META[m.eolStatus] : null;
  const battery = p.repairCosts.find((r) => r.part === "battery");
  const fair = computeFairPrice(p);
  const bandOf = (g: "S" | "A" | "B") => fair.bands.find((b) => b.grade === g)!;

  return {
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    brandLabel: BRAND_LABELS[p.brand],
    series: p.series,
    releaseDate: p.releaseDate,
    releasePriceKRW: p.releasePriceKRW,
    displayInch: p.specSummary.displayInch,

    latestResale: m.latestResale,
    latestResaleDate: m.latestResaleDate,
    prevResale: prev,
    residualPct: m.residualPct,

    monthsLeft: m.monthsLeftSecurity,
    securityEndDate: p.eol.securityEndDate,
    eolEstimated: p.eol.estimated,
    eolLabel: eolMeta?.label ?? "미상",
    eolTone: eolMeta?.tone ?? "neutral",

    displayRepairKRW: m.displayRepairKRW,
    batteryRepairKRW: battery?.officialKRW ?? null,
    repairBurdenPct: m.repairBurdenPct,

    criticalOpenIssues: m.criticalOpenIssues,
    liveIssueTitles: p.issues
      .filter((i) => i.status !== "patched")
      .slice(0, 3)
      .map((i) => i.title),

    verdictLabel: m.verdict.label,
    verdictTone: m.verdict.tone,
    score: decisionScore(p),

    projected12moKRW: projectResale(p, 12),

    fairA_lo: bandOf("A").loKRW,
    fairA_hi: bandOf("A").hiKRW,
    fairB_lo: bandOf("B").loKRW,
    fairB_hi: bandOf("B").hiKRW,
    fairS_lo: bandOf("S").loKRW,
    fairS_hi: bandOf("S").hiKRW,
  };
}
