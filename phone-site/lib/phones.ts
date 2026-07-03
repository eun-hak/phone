import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  formatManwon,
  formatMonthsAsYears,
  formatPct,
  formatYearMonth,
  monthsBetween,
} from "./format";

/* ─────────────────────────── 스키마 ─────────────────────────── */

const sourceRefSchema = z.object({
  label: z.string(),
  url: z.string().url(),
  asOf: z.string(),
});

export const REPAIR_PARTS = [
  "display",
  "battery",
  "back-glass",
  "camera",
  "charging-port",
] as const;

export type RepairPart = (typeof REPAIR_PARTS)[number];

export const REPAIR_PART_LABELS: Record<RepairPart, string> = {
  display: "화면(디스플레이)",
  battery: "배터리",
  "back-glass": "후면 유리",
  camera: "카메라",
  "charging-port": "충전 단자",
};

const phoneSchema = z.object({
  slug: z.string(),
  name: z.string(),
  brand: z.enum(["samsung", "apple"]),
  series: z.string(),
  releaseDate: z.string(),
  releasePriceKRW: z.number(),
  storageBase: z.string(),
  specSummary: z.object({
    chipset: z.string(),
    displayInch: z.number(),
    batteryMah: z.number(),
    ramGb: z.number(),
  }),
  eol: z.object({
    policy: z.string(),
    osEndDate: z.string().nullable(),
    securityEndDate: z.string().nullable(),
    estimated: z.boolean(),
    source: sourceRefSchema,
  }),
  repairCosts: z.array(
    z.object({
      part: z.enum(REPAIR_PARTS),
      officialKRW: z.number(),
      withCareKRW: z.number().optional(),
      source: sourceRefSchema,
    }),
  ),
  issues: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      severity: z.enum(["info", "common", "critical"]),
      status: z.enum(["open", "patched", "recall", "free-repair"]),
      summary: z.string(),
      symptoms: z.array(z.string()),
      solutions: z.array(z.string()),
      source: sourceRefSchema.optional(),
    }),
  ),
  buyRoutes: z.object({
    coupangUrl: z.string().url().optional(),
    danawaUrl: z.string().url().optional(),
    subsidyNote: z.string(),
    mvnoNote: z.string(),
    asOf: z.string(),
  }),
  resale: z
    .array(
      z.object({
        date: z.string(),
        priceKRW: z.number(),
        source: z.string(),
      }),
    )
    .min(1),
});

export type Phone = z.infer<typeof phoneSchema>;
export type SourceRef = z.infer<typeof sourceRefSchema>;
export type Issue = Phone["issues"][number];

export const BRAND_LABELS: Record<Phone["brand"], string> = {
  samsung: "삼성",
  apple: "애플",
};

/* ─────────────────────────── 파생 지표 ─────────────────────────── */

export type EolStatus = "ok" | "soon" | "urgent" | "ended";

export const EOL_STATUS_META: Record<
  EolStatus,
  { label: string; tone: "good" | "warn" | "serious" | "crit" }
> = {
  ok: { label: "지원 여유", tone: "good" },
  soon: { label: "2년 미만", tone: "warn" },
  urgent: { label: "종료 임박", tone: "serious" },
  ended: { label: "지원 종료", tone: "crit" },
};

export interface Verdict {
  label: string;
  tone: "good" | "warn" | "serious" | "crit";
  reasons: string[];
}

export interface PhoneMetrics {
  latestResale: number;
  latestResaleDate: string;
  residualPct: number;
  /** 보안 지원 잔여 개월 (null = 종료일 미상) */
  monthsLeftSecurity: number | null;
  eolStatus: EolStatus | null;
  /** 출시→종료 중 경과 비율 0~100 */
  supportElapsedPct: number | null;
  displayRepairKRW: number | null;
  /** 화면 수리비 ÷ 현 중고 시세 */
  repairBurdenPct: number | null;
  /** 추적 기간 월평균 시세 하락률 (기록 2개 미만이면 null) */
  avgMonthlyDropPct: number | null;
  criticalOpenIssues: number;
  verdict: Verdict;
}

export type PhoneWithMetrics = Phone & { metrics: PhoneMetrics };

const NOW = new Date();

function computeMetrics(p: Phone): PhoneMetrics {
  const sorted = [...p.resale].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const residualPct = (last.priceKRW / p.releasePriceKRW) * 100;

  const secEnd = p.eol.securityEndDate;
  const monthsLeftSecurity = secEnd ? monthsBetween(NOW, secEnd) : null;

  let eolStatus: EolStatus | null = null;
  if (monthsLeftSecurity !== null) {
    if (monthsLeftSecurity <= 0) eolStatus = "ended";
    else if (monthsLeftSecurity < 12) eolStatus = "urgent";
    else if (monthsLeftSecurity < 24) eolStatus = "soon";
    else eolStatus = "ok";
  }

  let supportElapsedPct: number | null = null;
  if (secEnd) {
    const total =
      new Date(secEnd).getTime() - new Date(p.releaseDate).getTime();
    const elapsed = NOW.getTime() - new Date(p.releaseDate).getTime();
    supportElapsedPct = Math.min(100, Math.max(0, (elapsed / total) * 100));
  }

  const display = p.repairCosts.find((r) => r.part === "display");
  const displayRepairKRW = display?.officialKRW ?? null;
  const repairBurdenPct =
    displayRepairKRW !== null ? (displayRepairKRW / last.priceKRW) * 100 : null;

  const avgMonthlyDropPct =
    sorted.length >= 2
      ? (((first.priceKRW - last.priceKRW) / first.priceKRW) * 100) /
        (sorted.length - 1)
      : null;

  const criticalOpenIssues = p.issues.filter(
    (i) => i.severity === "critical" && i.status === "open",
  ).length;

  const base = {
    latestResale: last.priceKRW,
    latestResaleDate: last.date,
    residualPct,
    monthsLeftSecurity,
    eolStatus,
    supportElapsedPct,
    displayRepairKRW,
    repairBurdenPct,
    avgMonthlyDropPct,
    criticalOpenIssues,
  };

  return { ...base, verdict: makeVerdict(p, base) };
}

function makeVerdict(
  p: Phone,
  m: Omit<PhoneMetrics, "verdict">,
): Verdict {
  const reasons: string[] = [];

  if (m.monthsLeftSecurity !== null && p.eol.securityEndDate) {
    if (m.monthsLeftSecurity <= 0) {
      reasons.push(
        "보안 업데이트가 이미 종료됨 — 금융앱 등 보안 민감 용도로는 부적합",
      );
    } else {
      reasons.push(
        `보안 업데이트 ${formatMonthsAsYears(m.monthsLeftSecurity)} 남음 (${formatYearMonth(p.eol.securityEndDate)}까지${p.eol.estimated ? " · 추정" : ""})`,
      );
    }
  }

  if (m.residualPct >= 55) {
    reasons.push(
      `잔존가치 ${formatPct(m.residualPct, 0)} — 감가 방어가 좋아 되팔 때 유리`,
    );
  } else if (m.residualPct >= 40) {
    reasons.push(`잔존가치 ${formatPct(m.residualPct, 0)} — 평균 수준의 감가`);
  } else {
    reasons.push(
      `잔존가치 ${formatPct(m.residualPct, 0)} — 신품보다 중고 구매가 유리한 가격 구간`,
    );
  }

  if (m.repairBurdenPct !== null && m.displayRepairKRW !== null) {
    if (m.repairBurdenPct >= 60) {
      reasons.push(
        `화면 수리비 ${formatManwon(m.displayRepairKRW)} = 현 시세의 ${formatPct(m.repairBurdenPct, 0)} — 파손 시 수리보다 기기 교체가 나을 수 있음`,
      );
    } else {
      reasons.push(
        `화면 수리비 부담률 ${formatPct(m.repairBurdenPct, 0)} (수리비 ÷ 현 시세)`,
      );
    }
  }

  if (m.criticalOpenIssues > 0) {
    reasons.push(
      `해결되지 않은 중대 이슈 ${m.criticalOpenIssues}건 — 이슈 문서 확인 필수`,
    );
  }

  if (m.eolStatus === "ended") {
    return { label: "권장하지 않음", tone: "crit", reasons };
  }
  if (m.eolStatus === "urgent") {
    return { label: "신중하게", tone: "serious", reasons };
  }
  if (m.eolStatus === "soon") {
    return { label: "조건부 추천", tone: "warn", reasons };
  }
  if (m.criticalOpenIssues > 0) {
    return { label: "조건부 추천", tone: "warn", reasons };
  }
  if (m.monthsLeftSecurity !== null && m.monthsLeftSecurity >= 36) {
    return { label: "지금 사도 좋아요", tone: "good", reasons };
  }
  return { label: "추천", tone: "good", reasons };
}

/* ─────────────────────────── 로더 ─────────────────────────── */

let cache: PhoneWithMetrics[] | null = null;

export function getAllPhones(): PhoneWithMetrics[] {
  if (cache) return cache;
  const dir = path.join(process.cwd(), "data", "phones");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const phones = files.map((f) => {
    const raw = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const parsed = phoneSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`데이터 검증 실패: ${f}\n${parsed.error.message}`);
    }
    return parsed.data;
  });
  cache = phones
    .map((p) => ({ ...p, metrics: computeMetrics(p) }))
    .sort(
      (a, b) =>
        new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime(),
    );
  return cache;
}

export function getPhone(slug: string): PhoneWithMetrics | undefined {
  return getAllPhones().find((p) => p.slug === slug);
}

/* ─────────────────────────── 비교 페이지 ─────────────────────────── */

export const CURATED_COMPARES: Array<[string, string]> = [
  ["galaxy-s26", "iphone-17"],
  ["galaxy-s26-ultra", "iphone-17-pro-max"],
  ["galaxy-s25", "iphone-16"],
  ["galaxy-s25-ultra", "iphone-16-pro"],
  ["iphone-16", "iphone-17"],
  ["iphone-16-pro-max", "iphone-17-pro-max"],
  ["galaxy-s25", "galaxy-s26"],
  ["galaxy-s24", "galaxy-s25"],
  ["iphone-15", "iphone-16"],
  ["iphone-15-pro", "iphone-16-pro"],
  ["galaxy-s24", "iphone-15"],
  ["galaxy-z-flip6", "galaxy-z-flip7"],
  ["galaxy-z-fold6", "galaxy-z-fold7"],
  ["iphone-air", "galaxy-s26"],
  ["galaxy-a35", "galaxy-s24"],
  ["iphone-13", "iphone-14"],
  ["iphone-14", "iphone-15"],
  ["iphone-13", "iphone-se-3"],
  ["galaxy-s22-ultra", "galaxy-s23-ultra"],
  ["galaxy-s23", "galaxy-s24"],
  ["galaxy-s22", "galaxy-s23"],
  ["galaxy-s21", "galaxy-s22"],
  ["galaxy-s21-ultra", "galaxy-s22-ultra"],
  ["galaxy-note20-ultra", "galaxy-s21-ultra"],
  ["galaxy-z-flip5", "galaxy-z-flip6"],
  ["galaxy-z-flip4", "galaxy-z-flip5"],
  ["galaxy-z-fold5", "galaxy-z-fold6"],
  ["iphone-11", "iphone-12"],
  ["iphone-12", "iphone-13"],
  ["iphone-14-pro", "iphone-15-pro"],
  ["iphone-15-pro-max", "iphone-16-pro-max"],
  ["galaxy-a34", "galaxy-a35"],
  ["galaxy-a25", "galaxy-a35"],
  ["iphone-se-2", "iphone-se-3"],
];

/** 두 slug의 정규(canonical) 비교 slug — 사전순 고정 */
export function canonicalCompareSlug(a: string, b: string): string {
  return [a, b].sort().join("-vs-");
}

export function parseCompareSlug(
  slug: string,
): [string, string] | null {
  const parts = slug.split("-vs-");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return [parts[0], parts[1]];
}
