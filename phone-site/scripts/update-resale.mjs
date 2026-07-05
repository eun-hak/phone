#!/usr/bin/env node
/**
 * 중고 시세 자동 수집 — 번개장터 검색 API (비공식 내부 API)
 *
 *   node scripts/update-resale.mjs                # 드라이런 (전 기종)
 *   node scripts/update-resale.mjs --limit 5      # 앞 5개 기종만 (테스트)
 *   node scripts/update-resale.mjs --write        # 이번 달 시세 포인트 반영
 *
 * 산출 방식:
 *  - 검색어 = 기종명(한글) + " 자급제/중고" 없이 원 이름 그대로
 *  - 전문판매자(proshop) 제외 → 개인거래 근사
 *  - 제목에 부품/케이스/수리 키워드 포함 매물 제외
 *  - 직전 시세의 30%~150% 범위 밖 가격 제외 (파손·허위 매물 컷)
 *  - IQR(사분위) 이상치 제거 후 중앙값 → 1,000원 단위 반올림
 *  - 표본 8개 미만이면 신뢰 불가로 건너뜀
 *  - 같은 달 포인트가 이미 있으면 갱신, 없으면 추가 (월 1포인트 유지)
 *
 * 주의: 비공식 API 이므로 요청 간 1.2s 딜레이, 실패는 건너뛰고 리포트만.
 */

import fs from "node:fs";
import path from "node:path";

const WRITE = process.argv.includes("--write");
const limitArg = process.argv.indexOf("--limit");
const LIMIT =
  limitArg > -1 ? Number(process.argv[limitArg + 1]) || Infinity : Infinity;

const DATA_DIR = path.join(process.cwd(), "data", "phones");
const TODAY = new Date().toISOString().slice(0, 10);
const THIS_MONTH = TODAY.slice(0, 7);

const EXCLUDE_WORDS = [
  "케이스", "필름", "수리", "부품", "액정만", "기판", "카메라만",
  "박스만", "정품박스", "충전기", "매입", "삽니다", "교환원함", "파손",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function iqrFilter(nums) {
  const s = [...nums].sort((a, b) => a - b);
  const q1 = s[Math.floor(s.length * 0.25)];
  const q3 = s[Math.floor(s.length * 0.75)];
  const iqr = q3 - q1;
  return s.filter((n) => n >= q1 - 1.5 * iqr && n <= q3 + 1.5 * iqr);
}

async function fetchPrices(query) {
  const url = `https://api.bunjang.co.kr/api/1/find_v2.json?q=${encodeURIComponent(query)}&order=score&n=100&page=0`;
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (phondex price tracker)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return (json.list ?? [])
    .filter((it) => !it.proshop)
    .filter((it) => it.ad !== true)
    .filter(
      (it) => !EXCLUDE_WORDS.some((w) => String(it.name ?? "").includes(w)),
    )
    .map((it) => Number(it.price))
    .filter((n) => Number.isFinite(n) && n > 10000);
}

const main = async () => {
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json"))
    .slice(0, LIMIT);

  let updated = 0;
  const skipped = [];

  for (const file of files) {
    const p = path.join(DATA_DIR, file);
    const data = JSON.parse(fs.readFileSync(p, "utf8"));
    const sorted = [...data.resale].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    const anchor = sorted.at(-1)?.priceKRW ?? data.releasePriceKRW * 0.5;

    let prices;
    try {
      prices = await fetchPrices(data.name);
    } catch (e) {
      skipped.push(`${data.slug}: 요청 실패 (${e.message})`);
      await sleep(1200);
      continue;
    }
    await sleep(1200);

    // 직전 시세 기준 밴드 컷 → IQR 컷 → 중앙값
    const banded = prices.filter(
      (n) => n >= anchor * 0.3 && n <= anchor * 1.5,
    );
    if (banded.length < 8) {
      skipped.push(
        `${data.slug}: 표본 부족 (밴드 내 ${banded.length}건 / 원본 ${prices.length}건)`,
      );
      continue;
    }
    const clean = iqrFilter(banded);
    const med = Math.round(median(clean) / 1000) * 1000;

    const point = {
      date: TODAY,
      priceKRW: med,
      source: "번개장터 개인매물 중앙값 (자동 수집)",
    };
    const idx = data.resale.findIndex((r) => r.date.slice(0, 7) === THIS_MONTH);
    const action = idx >= 0 ? "갱신" : "추가";
    console.log(
      `[${action}] ${data.slug}: ${med.toLocaleString()}원 (표본 ${clean.length}건, 직전 ${anchor.toLocaleString()}원)`,
    );
    if (WRITE) {
      if (idx >= 0) data.resale[idx] = point;
      else data.resale.push(point);
      fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
    }
    updated++;
  }

  console.log(
    `\n번개장터 시세 수집 ${WRITE ? "(반영 모드)" : "(드라이런)"} — 성공 ${updated} / 건너뜀 ${skipped.length}`,
  );
  if (skipped.length) {
    console.log("건너뜀 상세:");
    for (const s of skipped) console.log(`  - ${s}`);
  }
  if (!WRITE && updated > 0) {
    console.log("\n반영하려면: node scripts/update-resale.mjs --write");
  }
};

main().catch((e) => {
  console.error("실패:", e.message);
  process.exit(1);
});
