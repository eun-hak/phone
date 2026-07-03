// 리서치 에이전트가 반환한 원시 기종 데이터를 정규화해 data/phones/*.json 으로 저장.
// 사용: node scripts/add-phones.mjs scripts/new-phones.json
import fs from "node:fs";
import path from "node:path";

const SEVERITY = {
  info: "info",
  low: "info",
  common: "common",
  medium: "common",
  moderate: "common",
  critical: "critical",
  high: "critical",
};
const STATUS = {
  open: "open",
  unresolved: "open",
  ongoing: "open",
  active: "open",
  patched: "patched",
  resolved: "patched",
  fixed: "patched",
  recall: "recall",
  "free-repair": "free-repair",
  "free_repair": "free-repair",
};
const PARTS = new Set([
  "display",
  "battery",
  "back-glass",
  "camera",
  "charging-port",
]);
const PART_ALIAS = { backGlass: "back-glass", "back_glass": "back-glass" };

function normPart(p) {
  return PART_ALIAS[p] ?? p;
}

const fixUrl = (u) => (typeof u === "string" ? u.replace(/ /g, "%20") : u);
const fixSource = (s) => (s ? { ...s, url: fixUrl(s.url) } : s);

function buyRoutes(p) {
  const q = encodeURIComponent(`${p.name} 자급제`);
  const dq = encodeURIComponent(p.name);
  const isApple = p.brand === "apple";
  const isFoldable = /갤럭시 Z/.test(p.series ?? "");
  const isMid = p.brand === "samsung" && p.releasePriceKRW < 700000;

  let subsidyNote;
  let mvnoNote;
  if (isApple) {
    subsidyNote =
      "아이폰은 공시지원금이 적게 걸려 선택약정 25% 할인이 기본 선택지입니다. 프로 라인은 애플케어+ 가입 여부가 수리비 리스크를 좌우합니다.";
    mvnoNote =
      "감가 방어가 좋아 자급제 신품 구매 후 2~3년 뒤 되파는 전략의 2년 총비용이 낮은 축입니다. 요금제는 모요·스마트초이스 참고.";
  } else if (isFoldable) {
    subsidyNote =
      "폴더블은 공시지원금이 크게 걸리는 대표 기종군이지만 감가도 빨라, 2년 뒤 잔존가치까지 계산하면 지원금 매력이 상쇄되는 경우가 많습니다.";
    mvnoNote =
      "중고 구매 시 힌지·필름 상태 확인이 가격보다 중요합니다. 대면 거래로 개폐 상태를 직접 확인하세요.";
  } else if (isMid) {
    subsidyNote =
      "보급형은 공시지원금으로 실구매가가 크게 내려가지만, 고가 요금제 유지 조건의 2년 총비용을 반드시 계산하세요.";
    mvnoNote =
      "출고가가 낮아 자급제 + 알뜰폰 최저 요금제 조합이 통신비 최소화의 정석입니다.";
  } else {
    subsidyNote =
      "공시지원금과 선택약정 25% 할인을 월 요금 × 약정 개월 + 기기값의 2년 총비용으로 비교하세요. 성지 시세는 변동이 크니 총비용 계산 없이 계약하지 마세요.";
    mvnoNote =
      "신품가가 내려간 시점이라면 자급제 + 알뜰폰 조합의 가성비가 좋습니다. 중고 A급 시세와 신품 최저가 차이를 먼저 확인하세요.";
  }
  return {
    coupangUrl: `https://www.coupang.com/np/search?q=${q}`,
    danawaUrl: `https://search.danawa.com/dsearch.php?query=${dq}`,
    subsidyNote,
    mvnoNote,
    asOf: p.buyRoutesAsOf ?? "2026-07-02",
  };
}

function normalizePhone(raw) {
  const issues = (raw.issues ?? [])
    .map((i, idx) => {
      const severity = SEVERITY[String(i.severity).toLowerCase()];
      const status = STATUS[String(i.status).toLowerCase()];
      if (!severity || !status) {
        console.warn(`  ! ${raw.slug} 이슈 enum 미매핑: ${i.severity}/${i.status} — 스킵`);
        return null;
      }
      return {
        id: i.id || `${raw.slug}-issue-${idx + 1}`,
        title: i.title,
        severity,
        status,
        summary: i.summary,
        symptoms: i.symptoms ?? [],
        solutions: i.solutions ?? [],
        ...(i.source ? { source: fixSource(i.source) } : {}),
      };
    })
    .filter(Boolean);

  const repairCosts = (raw.repairCosts ?? [])
    .map((r) => {
      const out = {
        part: normPart(r.part),
        officialKRW: r.officialKRW,
        source: fixSource(r.source),
      };
      // 케어 자기부담금이 정가와 같으면(= 미상을 정가로 잘못 채운 경우) 제외
      if (typeof r.withCareKRW === "number" && r.withCareKRW !== r.officialKRW) {
        out.withCareKRW = r.withCareKRW;
      }
      return out;
    })
    .filter((r) => {
      if (!PARTS.has(r.part)) {
        console.warn(`  ! ${raw.slug} 수리 부품 미허용: ${r.part} — 스킵`);
        return false;
      }
      return typeof r.officialKRW === "number" && r.officialKRW > 0;
    });

  if (!raw.resale || raw.resale.length === 0) {
    throw new Error(`${raw.slug}: resale 데이터 없음 (최소 1포인트 필요)`);
  }

  return {
    slug: raw.slug,
    name: raw.name,
    brand: raw.brand,
    series: raw.series,
    releaseDate: raw.releaseDate,
    releasePriceKRW: raw.releasePriceKRW,
    storageBase: raw.storageBase,
    specSummary: raw.specSummary,
    eol: { ...raw.eol, source: fixSource(raw.eol.source) },
    repairCosts,
    issues,
    buyRoutes: buyRoutes(raw),
    resale: raw.resale,
  };
}

const inputPath = process.argv[2] ?? "scripts/new-phones.json";
const raws = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const outDir = path.join(process.cwd(), "data", "phones");

let ok = 0;
for (const raw of raws) {
  try {
    const phone = normalizePhone(raw);
    const file = path.join(outDir, `${phone.slug}.json`);
    const exists = fs.existsSync(file);
    fs.writeFileSync(file, JSON.stringify(phone, null, 2) + "\n");
    console.log(
      `  ${exists ? "↻" : "+"} ${phone.slug}.json (수리 ${phone.repairCosts.length} · 이슈 ${phone.issues.length} · 시세 ${phone.resale[0].priceKRW.toLocaleString()}원)`,
    );
    ok++;
  } catch (e) {
    console.error(`  ✗ ${raw.slug}: ${e.message}`);
  }
}
console.log(`\n완료: ${ok}/${raws.length} 기종 저장`);
